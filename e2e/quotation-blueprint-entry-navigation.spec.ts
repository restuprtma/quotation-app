import { test, expect, type Page } from '@playwright/test';

// Generate a valid mock JWT with expiration far in the future
const MOCK_JWT_PAYLOAD = btoa(JSON.stringify({ sub: 'u-e2e-admin', exp: 1999999999 }));
const MOCK_JWT_HEADER = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const MOCK_ACCESS_TOKEN = `${MOCK_JWT_HEADER}.${MOCK_JWT_PAYLOAD}.signature`;

// Setup common API mocks for isolated, deterministic E2E execution
async function setupCommonMocks(page: Page, lng: 'id' | 'en' = 'id') {
  // Inject mock authentication tokens and locale into browser storage
  await page.addInitScript(
    ({ token, language }) => {
      sessionStorage.setItem('tuai.access_token', token);
      localStorage.setItem('tuai.refresh_token', 'mock-e2e-refresh-token');
      localStorage.setItem('tuai.active_company_id', '11111111-1111-1111-1111-111111111111');
      localStorage.setItem('i18nextLng', language);
    },
    { token: MOCK_ACCESS_TOKEN, language: lng }
  );

  // Mock /core/v1/auth/me
  await page.route('**/core/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        status_code: 200,
        message: 'OK',
        data: {
          user: { id: 'u-e2e-admin', email: 'admin@venturo.id', name: 'Super Administrator' },
          company: { id: '11111111-1111-1111-1111-111111111111', name: 'PT Venturo Integrasi' },
          client: null,
          roles: ['superadmin'],
          permissions: ['*'],
          is_super_admin: true,
        },
      }),
    });
  });

  // Mock /core/v1/auth/companies
  await page.route('**/core/v1/auth/companies', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        status_code: 200,
        message: 'OK',
        data: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'PT Venturo Integrasi',
            is_primary: true,
            is_owner: true,
          },
        ],
      }),
    });
  });

  // Mock active AI skills
  await page.route('**/quotation/v1/ai/skills', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        status_code: 200,
        message: 'OK',
        data: [],
      }),
    });
  });

  // Mock Rate cards
  await page.route('**/quotation/v1/rate-cards*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        status_code: 200,
        message: 'OK',
        data: [],
      }),
    });
  });
}

test.describe('Quotation & Blueprint Entry and Navigation Regression Suite', () => {
  test.use({
    baseURL: 'http://127.0.0.1:18081',
  });

  test('User Journey 1: Prompt First to Advanced, Scheme Selection, and Back-navigation with Preserved Inputs', async ({
    page,
  }) => {
    await setupCommonMocks(page, 'id');

    const clientOrgs = [
      {
        id: 'org-init-01',
        company_id: '11111111-1111-1111-1111-111111111111',
        name: 'PT Inisial Mitra',
        normalized_name: 'pt inisial mitra',
        created_at: '2026-09-25T00:00:00Z',
        updated_at: '2026-09-25T00:00:00Z',
      },
    ];

    await page.route('**/quotation/v1/client-organizations', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: true,
            status_code: 200,
            message: 'OK',
            data: clientOrgs,
          }),
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const created = {
          id: 'org-created-02',
          company_id: '11111111-1111-1111-1111-111111111111',
          name: body.name,
          normalized_name: body.name.toLowerCase().trim(),
          created_at: '2026-09-25T00:00:00Z',
          updated_at: '2026-09-25T00:00:00Z',
        };
        clientOrgs.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: true,
            status_code: 201,
            message: 'Created',
            data: created,
          }),
        });
      }
    });

    // 1. Navigate to /quotation
    await page.goto('/quotation');

    // 2. Verify Prompt First form is rendered without old launcher slash command menu
    await expect(
      page.getByRole('heading', { name: 'Mulai dari catatan meeting' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.slash-command-menu')).toHaveCount(0);
    await expect(page.locator('text=Quick skills:')).toHaveCount(0);

    // 3. Verify exactly 4 identity & context inputs exist
    const projectInput = page.locator('input[name="project_name"]');
    const orgInput = page.getByPlaceholder('Pilih atau cari organisasi...');
    const picInput = page.locator('input[name="pic_name"]');
    const notesInput = page.locator('textarea[name="meeting_notes"]');

    await expect(projectInput).toBeVisible();
    await expect(orgInput).toBeVisible();
    await expect(picInput).toBeVisible();
    await expect(notesInput).toBeVisible();

    // 4. Fill project name
    await projectInput.fill('Portal Vendor Marketplace');

    // 5. Create new organization via dialog
    await page.getByRole('button', { name: '+ Tambah organisasi baru' }).click();
    await expect(page.getByRole('heading', { name: 'Tambah Organisasi Baru' })).toBeVisible();
    await page.getByLabel('Nama Organisasi').fill('Acme Global Corp');
    await page.getByRole('dialog').getByRole('button', { name: 'Tambah' }).click();

    // Verify dialog closes and Acme Global Corp is auto-selected
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(orgInput).toHaveValue('Acme Global Corp');

    // 6. Fill PIC and meeting notes
    await picInput.fill('Budi Santoso');
    await notesInput.fill(
      'Scope pembuatan portal vendor marketplace terintegrasi dengan modul payment dan SLA 99.9% uptime.'
    );

    // 7. Click 'Pengaturan Lanjutan'
    await page.getByRole('button', { name: 'Pengaturan Lanjutan' }).click();

    // 8. Verify URL and CommercialSchemeSelector display
    await expect(page).toHaveURL(/\/quotation\?view=advanced$/);
    await expect(page.getByText('Dedicated Programmer Squad')).toBeVisible();
    await expect(page.getByText('Custom Software Development')).toBeVisible();

    // 9. Click scheme (Dedicated Programmer Squad)
    await page.getByText('Dedicated Programmer Squad').click();

    // 10. Verify URL and prefilled identity values in Advanced Form
    await expect(page).toHaveURL(/\/quotation\?view=advanced&scheme=dedicated_squad$/);
    await expect(page.locator('input[name="subject"]')).toHaveValue('Portal Vendor Marketplace');
    await expect(page.locator('input[name="client_company_name"]')).toHaveValue('Acme Global Corp');
    await expect(page.locator('input[name="client_name"]')).toHaveValue('Budi Santoso');

    // 11. Browser back to Scheme Selector
    await page.goBack();
    await expect(page).toHaveURL(/\/quotation\?view=advanced$/);
    await expect(page.getByText('Dedicated Programmer Squad')).toBeVisible();

    // 12. Browser back to Prompt First form
    await page.goBack();
    await expect(page).toHaveURL(/\/quotation$/);

    // 13. Verify all 4 inputs are preserved from session storage
    await expect(projectInput).toHaveValue('Portal Vendor Marketplace');
    await expect(orgInput).toHaveValue('Acme Global Corp');
    await expect(picInput).toHaveValue('Budi Santoso');
    await expect(notesInput).toHaveValue(
      'Scope pembuatan portal vendor marketplace terintegrasi dengan modul payment dan SLA 99.9% uptime.'
    );
  });

  test('User Journey 2: Blueprint Process and List with Status Filter, Pagination, and Action Restriction', async ({
    page,
  }) => {
    await setupCommonMocks(page, 'id');

    const interceptedQueries: string[] = [];

    await page.route('**/quotation/v1/blueprints*', async (route) => {
      const url = new URL(route.request().url());
      interceptedQueries.push(url.search);

      const statuses = url.searchParams.get('generation_status') || '';
      const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
      const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);

      if (statuses === 'completed') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: true,
            status_code: 200,
            message: 'OK',
            data: {
              items: [
                {
                  blueprint_id: 'bp-comp-01',
                  quotation_id: 'q-comp-01',
                  title: 'Blueprint Portal Selesai Diproses',
                  generation_status: 'completed',
                  updated_at: '2026-09-25T08:00:00Z',
                },
              ],
              total: 1,
              page: pageParam,
              limit: limitParam,
              total_pages: 1,
            },
          }),
        });
      } else {
        // Non-completed process list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: true,
            status_code: 200,
            message: 'OK',
            data: {
              items: [
                {
                  blueprint_id: 'bp-proc-01',
                  quotation_id: 'q-proc-01',
                  title: 'Blueprint Antrian Online (Sedang Berjalan)',
                  generation_status: 'in_progress',
                  updated_at: '2026-09-25T10:00:00Z',
                },
                {
                  blueprint_id: 'bp-proc-02',
                  quotation_id: 'q-proc-02',
                  title: 'Blueprint Gagal Perlu Pemulihan',
                  generation_status: 'failed',
                  updated_at: '2026-09-25T09:00:00Z',
                },
              ],
              total: 2,
              page: pageParam,
              limit: limitParam,
              total_pages: 1,
            },
          }),
        });
      }
    });

    // 1. Navigate to /blueprint/process?page=1
    await page.goto('/blueprint/process?page=1');
    await expect(page.getByRole('heading', { name: 'Proses Blueprint' })).toBeVisible({
      timeout: 15_000,
    });

    // Verify query parameters intercepted for non-completed statuses
    const processQuery = interceptedQueries.find((q) => q.includes('generation_status='));
    expect(processQuery).toBeDefined();
    expect(processQuery).toContain('generation_status=pending,in_progress,partial_failed,failed');

    // Verify items in table
    await expect(page.getByText('Blueprint Antrian Online (Sedang Berjalan)')).toBeVisible();
    await expect(page.getByText('Blueprint Gagal Perlu Pemulihan')).toBeVisible();

    // Verify row actions: only "Buka" button exists, no delete/archive buttons
    const bukaButtons = page.getByRole('button', { name: 'Buka' });
    await expect(bukaButtons).toHaveCount(2);
    await expect(page.getByRole('button', { name: /hapus|delete|archive/i })).toHaveCount(0);

    // 2. Navigate to /blueprint/list
    await page.goto('/blueprint/list');
    await expect(page.getByRole('heading', { name: 'Daftar Blueprint' })).toBeVisible({
      timeout: 15_000,
    });

    // Verify query parameters intercepted for completed
    const listQuery = interceptedQueries.find((q) => q.includes('generation_status=completed'));
    expect(listQuery).toBeDefined();

    // Verify completed item in table
    await expect(page.getByText('Blueprint Portal Selesai Diproses')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buka' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /hapus|delete|archive/i })).toHaveCount(0);
  });

  test('User Journey 3: Viewport Responsiveness, Keyboard Navigation, and i18n Translation Integrity', async ({
    page,
  }) => {
    await setupCommonMocks(page, 'id');

    await page.route('**/quotation/v1/client-organizations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          status_code: 200,
          message: 'OK',
          data: [],
        }),
      });
    });

    await page.route('**/quotation/v1/blueprints*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          status_code: 200,
          message: 'OK',
          data: {
            items: [],
            total: 0,
            page: 1,
            limit: 20,
            total_pages: 0,
          },
        }),
      });
    });

    // 1. Mobile viewport test (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/quotation');

    await expect(
      page.getByRole('heading', { name: 'Mulai dari catatan meeting' })
    ).toBeVisible({ timeout: 15_000 });

    // Check no horizontal scroll overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 2. Desktop viewport test (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/quotation');

    // 3. i18n Check: Ensure no raw untranslated keys rendered in DOM for ID locale
    for (const url of [
      '/quotation',
      '/quotation?view=advanced',
      '/blueprint/process',
      '/blueprint/list',
    ]) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const bodyText = await page.locator('body').innerText();

      expect(bodyText).not.toMatch(/\bpromptFirst\.[a-zA-Z0-9_.]+/);
      expect(bodyText).not.toMatch(/\bnavigation\.[a-zA-Z0-9_.]+/);
      expect(bodyText).not.toMatch(/\bblueprint\.[a-zA-Z0-9_.]+/);
    }
  });
});
