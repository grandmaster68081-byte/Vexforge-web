import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const owner = 'grandmaster68081-byte';
const repository = 'Vexforge-web';
const workflow = 'vexforge-unity-android-github.yml';
const branch = 'main';
const apiBase = `https://api.github.com/repos/${owner}/${repository}`;
const pollIntervalMs = 30_000;
const dispatchDiscoveryTimeoutMs = 120_000;

function printHelp() {
  console.log(
    [
      'Dispatch and monitor the official VEXFORGE Unity Android GitHub Actions build.',
      '',
      'Requirements:',
      '- Run from a clean, synchronized local main branch.',
      '- Store GITHUB_PAT as a Replit Secret; the value is never printed.',
      '- Unity activation credentials remain in GitHub Actions Secrets.',
      '',
      'The command reuses a build already running for the same commit and refuses',
      'to start a second concurrent build for a different commit.',
    ].join('\n'),
  );
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function requireRepositoryState() {
  const currentBranch = git('branch', '--show-current');
  if (currentBranch !== branch) {
    throw new Error(`Expected branch ${branch}; current branch is ${currentBranch || '(detached)'}.`);
  }

  const dirty = git('status', '--porcelain', '--untracked-files=normal');
  if (dirty) {
    throw new Error('The working tree is not clean. Commit or discard local changes before dispatching Unity.');
  }

  return git('rev-parse', 'HEAD');
}

function headers() {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error('GITHUB_PAT is missing from Replit Secrets.');
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'content-type': 'application/json',
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const detail = typeof data?.message === 'string' ? `: ${data.message}` : '';
    throw new Error(`GitHub API returned HTTP ${response.status}${detail}`);
  }

  return { response, data };
}

async function readMainSha() {
  const { data } = await request(`/commits/${branch}`);
  if (typeof data?.sha !== 'string') throw new Error('GitHub did not return the main branch commit SHA.');
  return data.sha;
}

async function listRuns() {
  const { data } = await request(
    `/actions/workflows/${workflow}/runs?branch=${branch}&per_page=100`,
  );
  return Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
}

async function waitForDispatchedRun(expectedSha, dispatchTime) {
  const deadline = Date.now() + dispatchDiscoveryTimeoutMs;
  while (Date.now() < deadline) {
    const runs = await listRuns();
    const run = runs.find(
      (candidate) =>
        candidate.head_sha === expectedSha &&
        candidate.event === 'workflow_dispatch' &&
        Date.parse(candidate.created_at) >= dispatchTime - 120_000,
    );
    if (run) return run;
    await delay(5_000);
  }
  throw new Error('GitHub accepted the dispatch, but the matching run did not appear within two minutes.');
}

async function waitForCompletion(run) {
  console.log(`Monitoring Unity build ${run.html_url}`);
  while (true) {
    const { data } = await request(`/actions/runs/${run.id}`);
    if (data?.status === 'completed') return data;
    console.log(`Unity build status: ${data?.status ?? 'unknown'}`);
    await delay(pollIntervalMs);
  }
}

async function summarizeRun(run) {
  const [{ data: jobs }, { data: artifacts }] = await Promise.all([
    request(`/actions/runs/${run.id}/jobs?per_page=100`),
    request(`/actions/runs/${run.id}/artifacts?per_page=100`),
  ]);

  const failedSteps = (jobs?.jobs ?? []).flatMap((job) =>
    (job.steps ?? [])
      .filter((step) => step.conclusion === 'failure')
      .map((step) => `${job.name}: ${step.name}`),
  );
  const artifactNames = (artifacts?.artifacts ?? [])
    .filter((artifact) => !artifact.expired)
    .map((artifact) => artifact.name);

  console.log(`Unity workflow: ${run.conclusion ?? 'unknown'} — ${run.html_url}`);
  if (artifactNames.length) console.log(`Available artifacts: ${artifactNames.join(', ')}`);
  if (failedSteps.length) console.error(`Failed steps: ${failedSteps.join('; ')}`);

  if (run.conclusion !== 'success') process.exitCode = 1;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  const expectedSha = requireRepositoryState();
  const remoteSha = await readMainSha();
  if (expectedSha !== remoteSha) {
    throw new Error(
      `Local HEAD ${expectedSha} does not match GitHub main ${remoteSha}. Fetch and synchronize before dispatching.`,
    );
  }

  const activeRuns = (await listRuns()).filter(
    (run) => run.status !== 'completed' && run.event === 'workflow_dispatch',
  );
  if (activeRuns.length) {
    const activeRun = activeRuns[0];
    if (activeRun.head_sha !== expectedSha) {
      throw new Error(
        `Another Unity build is active for a different commit (${activeRun.head_sha}): ${activeRun.html_url}. Refusing a concurrent build.`,
      );
    }
    console.log(`Reusing the active Unity build for ${expectedSha}.`);
    await summarizeRun(await waitForCompletion(activeRun));
    return;
  }

  const dispatchTime = Date.now();
  const { response } = await request(`/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: branch }),
  });
  if (response.status !== 204) {
    throw new Error(`GitHub returned unexpected dispatch status ${response.status}.`);
  }

  console.log(`Dispatched Unity Android build for ${expectedSha}. Waiting for its run record.`);
  const run = await waitForDispatchedRun(expectedSha, dispatchTime);
  await summarizeRun(await waitForCompletion(run));
}

main().catch((error) => {
  console.error(`Unity Android build could not be completed: ${error.message}`);
  process.exitCode = 1;
});
