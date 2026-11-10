import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const REPO = path.resolve(__dirname, '..');
const TSX = path.join(REPO, 'node_modules', '.bin', 'tsx');
const SCRIPT = path.join(REPO, 'scripts', 'make-summary.ts');
const FIXTURES = path.join(__dirname, '__fixtures__');
const BASE_ENV = { PROJECT: 'demo-project', ENVIRONMENT: 'staging', OWNER: 'Jane QA' };

interface RunResult { code: number | null; stdout: string; stderr: string; summary: any }

/** Runs make-summary in a fresh temp cwd; `fixture` = file name in __fixtures__ or null for "no results.json". */
function run(fixture: string | null, env: Record<string, string | undefined> = BASE_ENV): RunResult {
  const cwd = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'make-summary-')));
  try {
    if (fixture) {
      fs.mkdirSync(path.join(cwd, 'qa-report'));
      const raw = fs.readFileSync(path.join(FIXTURES, fixture), 'utf8').replace(/\/ROOT/g, cwd.split(path.sep).join('/'));
      fs.writeFileSync(path.join(cwd, 'qa-report', 'results.json'), raw);
    }
    const cleanEnv: NodeJS.ProcessEnv = { PATH: process.env.PATH, HOME: process.env.HOME, ...env };
    const r = spawnSync(TSX, [SCRIPT], { cwd, env: cleanEnv, encoding: 'utf8' });
    const file = path.join(cwd, 'qa-report', 'summary.json');
    return {
      code: r.status,
      stdout: r.stdout,
      stderr: r.stderr,
      summary: fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null,
    };
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

test('all passed', () => {
  const r = run('all-passed.json');
  assert.equal(r.code, 0);
  const s = r.summary;
  assert.equal(s.schemaVersion, 1);
  assert.equal(s.status, 'PASSED');
  assert.deepEqual([s.passed, s.failed, s.flaky, s.skipped, s.total], [3, 0, 0, 1, 4]);
  assert.equal(s.duration, 12346);
  assert.deepEqual(s.failedTests, []);
  assert.equal(s.project, 'demo-project');
  assert.equal(s.environment, 'staging');
  assert.equal(s.owner, 'Jane QA');
  assert.match(s.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('flaky only -> PASSED_WITH_FLAKY, exit 0', () => {
  const r = run('flaky.json');
  assert.equal(r.code, 0);
  assert.equal(r.summary.status, 'PASSED_WITH_FLAKY');
  assert.equal(r.summary.flaky, 1);
  assert.equal(r.summary.total, 3);
  assert.deepEqual(r.summary.failedTests, []);
});

test('failed test with multi-line ANSI error', () => {
  const r = run('failed.json');
  assert.equal(r.code, 0);
  const s = r.summary;
  assert.equal(s.status, 'FAILED');
  assert.deepEqual([s.passed, s.failed, s.total], [4, 1, 5]);
  assert.equal(s.failedTests.length, 1);
  assert.deepEqual(s.failedTests[0], {
    title: 'Cart › adds a product',
    file: 'tests/smoke/feed.spec.ts',
    error: 'Error: expect(locator).toBeVisible()',
  });
});

test('global/setup error -> FAILED with one global entry', () => {
  const r = run('global-error.json');
  assert.equal(r.code, 0);
  assert.equal(r.summary.status, 'FAILED');
  assert.equal(r.summary.total, 0);
  assert.equal(r.summary.failedTests.length, 1);
  assert.equal(r.summary.failedTests[0].title, 'Global error (outside tests)');
  assert.equal(r.summary.failedTests[0].file, 'tests/setup/auth.setup.ts');
  assert.equal(r.summary.failedTests[0].error, 'Error: global setup failed');
});

test('unreadable results.json -> FAILED, counts 0', () => {
  const r = run('unreadable.json');
  assert.equal(r.code, 0);
  assert.equal(r.summary.status, 'FAILED');
  assert.deepEqual([r.summary.passed, r.summary.failed, r.summary.flaky, r.summary.skipped, r.summary.total, r.summary.duration], [0, 0, 0, 0, 0, 0]);
});

test('missing results.json -> FAILED, counts 0', () => {
  const r = run(null);
  assert.equal(r.code, 0);
  assert.equal(r.summary.status, 'FAILED');
  assert.equal(r.summary.total, 0);
});

test('CI env vars end up in the summary', () => {
  const r = run('all-passed.json', {
    ...BASE_ENV,
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: 'a'.repeat(40),
    GITHUB_EVENT_NAME: 'schedule',
    RUN_LINK: 'https://github.com/o/r/actions/runs/1',
  });
  assert.equal(r.summary.branch, 'main');
  assert.equal(r.summary.commit, 'a'.repeat(40));
  assert.equal(r.summary.trigger, 'schedule');
  assert.equal(r.summary.runLink, 'https://github.com/o/r/actions/runs/1');
});

test('local fallback: trigger "local", empty runLink', () => {
  const r = run('all-passed.json');
  assert.equal(r.summary.trigger, 'local');
  assert.equal(r.summary.runLink, '');
});

for (const name of ['PROJECT', 'ENVIRONMENT', 'OWNER']) {
  test(`missing ${name} -> exit 1`, () => {
    const env: Record<string, string | undefined> = { ...BASE_ENV };
    delete env[name];
    const r = run('all-passed.json', env);
    assert.equal(r.code, 1);
    assert.match(r.stderr, new RegExp(`${name} is required`));
    assert.equal(r.summary, null);
  });
}

test('invalid PROJECT / ENVIRONMENT slug -> exit 1', () => {
  assert.equal(run('all-passed.json', { ...BASE_ENV, PROJECT: 'Bad_Name' }).code, 1);
  assert.equal(run('all-passed.json', { ...BASE_ENV, ENVIRONMENT: 'hq_ch' }).code, 1);
});
