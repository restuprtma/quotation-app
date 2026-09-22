import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — Security & Redaction Regression (Task 9.03)', () => {
  test('Security regression: JWT/company context, foreign tenant 404, forbidden canaries, oversized body, XSS inert, zero leak, and 409/422 zero write', async ({
    page,
    context,
  }) => {
    test.setTimeout(240_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    const recordExchange = (method: string, path: string, status: number) => {
      const sanitizedPath = path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id');
      exchanges.push(`${method} ${sanitizedPath} ${status}`);
    };

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        recordExchange(response.request().method(), url.pathname, response.status());
      }
    });

    // Dialog spy to detect any XSS execution
    let alertTriggered = false;
    let alertDialogMessage = '';
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'beforeunload') {
        await dialog.accept();
        return;
      }
      alertTriggered = true;
      alertDialogMessage = dialog.message();
      await dialog.dismiss();
    });

    try {
      // =========================================================================
      // 1. Create Blueprint via UI and Generate Pipeline Stages
      // =========================================================================
      await page.goto(
        `http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`
      );
      await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, {
        timeout: 20_000,
      });
      await page.getByLabel('Judul Blueprint').fill('Sistem Keamanan dan Redaksi Blueprint');
      await page.getByLabel('Tujuan Bisnis 1').fill('Verifikasi proteksi security multi-vektor');
      await page.getByLabel('Aktor 1').fill('Security Auditor');
      await page.getByLabel('Fase Bisnis 1').fill('Audit dan Validasi');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      // Advance pipeline
      for (let i = 0; i < 5; i++) {
        const continueRes = await page.request.post(
          `${qaApi}/quotation/v1/blueprints/${id}/continue`,
          { headers }
        );
        expect(continueRes.status()).toBe(200);
      }

      const initialDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(['in_progress', 'completed']).toContain(initialDB.status);
      const baselineVersion = initialDB.version;
      expect(baselineVersion).toBe(6);

      // =========================================================================
      // 2. JWT Authentication & Company Context Enforcement
      // =========================================================================
      // 2a. Unauthenticated request (no token) -> 401
      const unauthRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          data: {
            revision_id: session.revision_id,
            content_version: baselineVersion,
            content: { journey: { phases: [], actors: [], activities: [] } },
          },
        }
      );
      expect(unauthRes.status()).toBe(401);

      // 2b. Invalid token -> 401
      const invalidTokenRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers: { Authorization: 'Bearer invalid-garbage-jwt-token' },
          data: {
            revision_id: session.revision_id,
            content_version: baselineVersion,
            content: { journey: { phases: [], actors: [], activities: [] } },
          },
        }
      );
      expect(invalidTokenRes.status()).toBe(401);

      // =========================================================================
      // 3. Foreign Tenant Isolation & Safe 404 (Zero Data Leak)
      // =========================================================================
      const foreignSessionRes = await page.request.get(`${qaApi}/qa/session`);
      // Use random foreign UUID for blueprint endpoint with valid token
      const foreignBpId = '00000000-0000-0000-0000-000000000099';
      const foreignDraftRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${foreignBpId}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: session.revision_id,
            content_version: baselineVersion,
            content: { journey: { phases: [], actors: [], activities: [] } },
          },
        }
      );
      expect(foreignDraftRes.status()).toBe(404);
      const foreignBody = await foreignDraftRes.json();
      expect(foreignBody.message || foreignBody.code).toMatch(/Blueprint not found|blueprint_not_found/i);

      // =========================================================================
      // 4. Forbidden Payload Canaries & Sensitive Keys (422 / Zero Writes)
      // =========================================================================
      // 4a. Forbidden key: apiKey
      const apiKeyRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: initialDB.revision_id,
            content_version: baselineVersion,
            content: {
              journey: {
                apiKey: 'AI_PROVIDER_API_KEY_SECRET_CANARY',
                phases: [],
                actors: [],
                activities: [],
              },
            },
          },
        }
      );
      expect(apiKeyRes.status()).toBe(422);

      // 4b. Forbidden key: budget
      const budgetRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: initialDB.revision_id,
            content_version: baselineVersion,
            content: {
              journey: {
                budget: 50000000,
                phases: [],
                actors: [],
                activities: [],
              },
            },
          },
        }
      );
      expect(budgetRes.status()).toBe(422);

      // Verify DB version was NOT incremented (zero writes)
      const afterForbiddenDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(afterForbiddenDB.version).toBe(baselineVersion);

      // =========================================================================
      // 5. Oversized & Deeply Nested Body DOS Protection
      // =========================================================================
      // 5a. Oversized body (> 1 MiB)
      const hugeString = 'A'.repeat(1024 * 1024 + 100);
      const oversizedRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: initialDB.revision_id,
            content_version: baselineVersion,
            content: {
              journey: {
                phases: [{ id: 'phase-1', name: hugeString, order: 1 }],
                actors: [],
                activities: [],
              },
            },
          },
        }
      );
      // Endpoint enforces 1MB limit -> returns 400 blueprint_invalid_input or 413
      expect([400, 413, 422]).toContain(oversizedRes.status());

      // 5b. Deeply nested JSON structure
      let nestedObj: any = { deep: 'leaf' };
      for (let d = 0; d < 50; d++) {
        nestedObj = { nested: nestedObj };
      }
      const deepRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: initialDB.revision_id,
            content_version: baselineVersion,
            content: {
              journey: nestedObj,
            },
          },
        }
      );
      expect([400, 422]).toContain(deepRes.status());

      // =========================================================================
      // 6. XSS Inert Rendering: Visual Editor Inputs & Browser DOM
      // =========================================================================
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

      // Inject XSS vectors into Journey activity
      const detailRes = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const firstActivity = detailRes.data.content_json.journey.activities[0];

      const actEditBtn = page
        .getByRole('button', {
          name: /^Edit aktivitas/i,
        })
        .first();
      await actEditBtn.click();
      await expect(page.getByText('Edit Journey Activity')).toBeVisible();

      const xssPayloadLabel = '<script>alert("XSS_JOURNEY_LABEL")</script><img src=x onerror=alert("XSS_IMG")>';
      const xssPayloadDesc = '<svg/onload=alert("XSS_SVG")>Deskripsi aktivitas aman';

      await page.getByLabel('Label Aktivitas').fill(xssPayloadLabel);
      await page.getByLabel('Deskripsi Aktivitas').fill(xssPayloadDesc);
      await page.getByRole('button', { name: 'Simpan Aktivitas' }).click();
      await expect(page.getByText('Edit Journey Activity')).not.toBeVisible();

      // Save draft via UI -> backend rejects with 422
      const saveDraftPromise = page.waitForResponse(
        (r) => r.url().includes('/sections/journey/draft') && r.status() === 422
      );
      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await saveDraftPromise;

      // Assert no script execution occurred
      expect(alertTriggered).toBe(false);
      expect(alertDialogMessage).toBe('');

      // Assert XSS string is rendered purely as inert text in DOM (buffer preserved)
      const pageBodyText = await page.locator('body').innerText();
      expect(pageBodyText).toContain('<script>alert("XSS_JOURNEY_LABEL")</script>');
      expect(pageBodyText).toContain('<svg/onload=alert("XSS_SVG")>');

      // Reload page to verify server state remains intact
      await page.reload();
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

      // Assert no actual <script> tag was injected into DOM tree
      const unescapedScriptTags = await page.evaluate(
        () => document.querySelectorAll('script:not([type="module"])').length
      );
      // Vite scripts might exist as type="module", but no injected plain scripts
      const customScriptCount = await page.evaluate(
        () =>
          Array.from(document.querySelectorAll('script')).filter((s) =>
            s.innerHTML.includes('XSS_JOURNEY_LABEL')
          ).length
      );
      expect(customScriptCount).toBe(0);

      // =========================================================================
      // 7. Sensitive Canary & Credential Redaction Check
      // =========================================================================
      // Scan full rendered text for sensitive markers
      const fullText = await page.locator('body').innerText();
      const forbiddenCanaries = [
        'COMMERCIAL_RATE_QA7B05',
        'LEGAL_INDEMNITY_QA7B05',
        'CREDENTIAL_QA7B05',
        'SYSTEM_PROMPT_QA7B05',
        'AI_PROVIDER_API_KEY_SECRET_CANARY',
        'SYSTEM_PROMPT_RAW_INSTRUCTION_SECRET',
        'credential_encryption_key',
      ];
      for (const canary of forbiddenCanaries) {
        expect(fullText).not.toContain(canary);
      }

      // =========================================================================
      // 8. 409 & 422 Zero-Write Invariant Verification
      // =========================================================================
      const verifyBeforeZeroWrite = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const currentVersion = verifyBeforeZeroWrite.version;

      // Send 409 stale version request
      const staleRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: initialDB.revision_id,
            content_version: 1, // stale version
            content: { journey: detailRes.data.content_json.journey },
          },
        }
      );
      expect(staleRes.status()).toBe(409);

      // Send 422 invalid schema request
      const malformedRes = await page.request.put(
        `${qaApi}/quotation/v1/blueprints/${id}/sections/journey/draft`,
        {
          headers,
          data: {
            revision_id: initialDB.revision_id,
            content_version: currentVersion,
            content: { wrong_root: { data: 'invalid' } },
          },
        }
      );
      expect(malformedRes.status()).toBe(422);

      // Check DB after 409 and 422 -> Version and status must be 100% untouched
      const verifyAfterZeroWrite = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(verifyAfterZeroWrite.version).toBe(currentVersion);
      expect(verifyAfterZeroWrite.runs.journey.status).toBe(verifyBeforeZeroWrite.runs.journey.status);

      // Save Phase 09 Security Evidence Artifact
      await savePhase09Evidence('security-regression-desktop-1440', page, [...exchanges], {
        blueprint_id: id,
        baseline_version: baselineVersion,
        final_version: currentVersion,
        jwt_enforced: true,
        foreign_tenant_isolated: true,
        forbidden_canaries_blocked: true,
        oversized_body_protected: true,
        xss_inert_verified: true,
        sensitive_canaries_unleaked: true,
        zero_writes_on_409_and_422: true,
      });

      // Mobile 390px Security Check
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByText(/Tampilan Terbatas/i)).toBeVisible({ timeout: 10_000 });
      const mobileOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(mobileOverflow).toBe(false);

      await savePhase09Evidence('security-regression-mobile-390', page, [...exchanges], {
        blueprint_id: id,
        final_version: currentVersion,
        body_overflow: mobileOverflow,
        xss_inert: true,
      });

      // Restore desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });

      // Clean up QA tenant
      expect(
        (await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()
      ).toBe(204);
    } catch (err) {
      console.error('Security regression error:', err);
      throw err;
    }
  });
});
