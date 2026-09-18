import type { Page } from '@playwright/test';

export type QASession = { token: string; company_id: string; quotation_id: string; revision_id: string };
export const qaApi = 'http://127.0.0.1:18080';

export async function qaSession(page: Page): Promise<QASession> {
  const response = await page.request.get(`${qaApi}/qa/session`);
  if (!response.ok()) throw new Error(`QA session failed: ${response.status()}`);
  const session = (await response.json()) as QASession;
  await page.addInitScript(({ token, company_id }) => {
    sessionStorage.setItem('tuai.access_token', token);
    localStorage.setItem('tuai.active_company_id', company_id);
  }, session);
  return session;
}
