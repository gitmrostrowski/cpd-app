import { spawnSync } from 'node:child_process';

// Historical Home snapshots describe mutually exclusive designs. Keep them
// available for history; validate the current design plus functional checks.
// This is a scoped release suite, not every historical snapshot in the repo.
// Existing failures from the broader audit are listed in RELEASE-HOME-v6.28.1.md.
const checks = [
  'check-v4-foundation.mjs',
  'check-v5-organization-panel.mjs',
  'check-v5-1-invitations-help.mjs',
  'check-v5-1c-invitation-onboarding.mjs',
  'check-v5-1d-confirmation-notice.mjs',
  'check-v5-1e-organization-context.mjs',
  'check-v6-2-1-contact-delivery.mjs',
  'check-v6-20-deadlines-and-pace.mjs',
  'check-v6-21-consistency-and-routes.mjs',
  'check-v6-22-report-export.mjs',
  'check-v6-23-limits-and-timeline.mjs',
  'check-v6-24-overdue-and-actions.mjs',
  'check-v6-25-2-nil-details.mjs',
  'check-v6-25-3-panel-views-and-limits.mjs',
  'check-v6-25-4-panel-consistency.mjs',
  'check-v6-26-3-nil-test-fixtures.mjs',
  'check-v6-26-4-admin-training-cards.mjs',
  'check-v6-26-import-review-and-panel-color.mjs',
  'check-v6-27-11-nil-descriptions.mjs',
  'check-v6-27-5-layout-and-semantic-colors.mjs',
  'check-v6-29-home.mjs',
  'check-v6-29-3-role-pages.mjs',
  'check-v6-30-app-style.mjs',
  'check-v6-31-panel-layout.mjs',
  'check-home-rendering.cjs',
];
let failed = 0;
for (const file of checks) {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', `scripts/${file}`], { encoding: 'utf8' });
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${file}`);
  if (result.status !== 0) {
    failed++;
    console.log(result.stdout.slice(0, 3000), result.stderr.slice(0, 3000));
  }
}
if (failed) process.exit(1);
