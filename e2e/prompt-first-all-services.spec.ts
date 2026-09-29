import { test } from '@playwright/test';

const services = [
  'dedicated_squad',
  'subscription_saas',
  'white_label',
  'standalone_maintenance',
  'custom_development',
  'kiosk_queue_system',
  'talent_outsourcing',
  'cloud_infrastructure',
] as const;

const states = ['complete', 'incomplete'] as const;
const priceSources = ['catalog', 'user', 'unavailable'] as const;
const persistence = ['save_reload'] as const;

test.describe('Prompt-first all-services smoke matrix', () => {
  for (const service of services) {
    for (const state of states) {
      for (const priceSource of priceSources) {
        for (const persistenceMode of persistence) {
          test(`${service} / ${state} / ${priceSource} / ${persistenceMode}`, async () => {
            test.skip(
              true,
              'Requires an isolated API/database fixture and authenticated browser session; not run in this workspace.'
            );
          });
        }
      }
    }
  }
});
