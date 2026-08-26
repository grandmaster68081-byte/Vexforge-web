import { readFile } from 'node:fs/promises';

const files = {
  route: 'mobile/app/tutorial.tsx',
  layout: 'mobile/app/_layout.tsx',
  home: 'mobile/app/(tabs)/index.tsx',
  supabase: 'mobile/lib/supabase.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['tutorial route exists', contents.route.includes('export default function TutorialScreen')],
  ['tutorial has seven canonical steps', contents.route.includes('const TUTORIAL_STEPS') && contents.route.includes('TUTORIAL_TOTAL_STEPS')],
  ['tutorial reads persisted progress', contents.route.includes('progress.tutorial_step')],
  ['tutorial advances through Supabase', contents.route.includes('advanceTutorialStep(session, player.id')],
  ['tutorial can be skipped authoritatively', contents.route.includes('skipTutorial(session, player.id')],
  ['tutorial links only existing mobile surfaces', ['/collection', '/battle', '/deck'].every((route) => contents.route.includes(`'${route}'`))],
  ['tutorial guards unauthenticated access', contents.route.includes('Redirect href="/auth"')],
  ['tutorial exposes loading and error states', contents.route.includes('LoadingState') && contents.route.includes('ErrorState')],
  ['tutorial has accessible test hooks', ['tutorial-primary', 'tutorial-skip', 'tutorial-retry'].every((testID) => contents.route.includes(`testID="${testID}"`))],
  ['tutorial has no client combat simulation', !contents.route.includes('simulate') && !contents.route.includes('fake') && !contents.route.includes('mock')],
  ['tutorial is registered in the root stack', contents.layout.includes('name="tutorial"')],
  ['home exposes the tutorial entry point', contents.home.includes("router.push('/tutorial')") && contents.home.includes('testID="home-tutorial"')],
  ['supabase exposes monotonic tutorial update', contents.supabase.includes('export async function advanceTutorialStep') && contents.supabase.includes('tutorial_step=lt.')],
  ['supabase exposes tutorial completion', contents.supabase.includes('export async function skipTutorial') && contents.supabase.includes('TUTORIAL_DONE_STEP')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile tutorial verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile tutorial verification OK: ${assertions.length}/${assertions.length} checks`);