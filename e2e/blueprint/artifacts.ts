import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from '@playwright/test';

const forbidden = /Bearer\s|tuai\.access_token|AI_PROVIDER_API_KEY_SECRET_CANARY|SYSTEM_PROMPT_RAW_INSTRUCTION_SECRET/i;

export async function saveEvidence(
  name: string,
  page: Page,
  exchanges: string[],
  summary: Record<string, unknown>,
  phase = 'blueprint-phase-08'
) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Invalid evidence name');
  const targetDir = path.resolve(process.cwd(), '..', 'docs', 'snapshots', phase);
  const record = {
    timestamp: new Date().toISOString(),
    viewport: page.viewportSize(),
    provider: 'qa-fixture-scripted-v1',
    exchanges,
    summary,
  };
  const body = JSON.stringify(record, null, 2);
  if (forbidden.test(body)) throw new Error('Sensitive value in evidence');
  await mkdir(targetDir, { recursive: true });
  const png = path.join(targetDir, `${name}.png`);
  const json = path.join(targetDir, `${name}.json`);
  await page.screenshot({ path: png, fullPage: true });
  await writeFile(json, body + '\n', 'utf8');
  return { png, json };
}

export async function savePhase09Evidence(
  name: string,
  page: Page,
  exchanges: string[],
  summary: Record<string, unknown>
) {
  return saveEvidence(name, page, exchanges, summary, 'blueprint-phase-09');
}

