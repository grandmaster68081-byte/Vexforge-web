> HISTORICAL / SUPERSEDED (2026-10-04). This prior Expo-only continuation
> order is retained only as behavior/source evidence. Its Unity prohibitions
> and runtime direction are superseded by `VEXFORGE_CONTEXT.md` and
> `docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md`.

VEXFORGE — EXPO GAME RUNTIME
REPLIT AUTONOMOUS CONTINUATION ORDER v5
MAIN-PERSISTENT / 2.5D TCG-FIRST / NO-DASHBOARD / NO-UNITY / NO-WEB
DATE: 2026-09-30

======================================================================
0. EXECUTIVE RULE — READ THIS FIRST
======================================================================

THIS DOCUMENT IS THE ACTIVE EXECUTION CONTRACT FOR THE CURRENT VEXFORGE EXPO GAME.

THE ONLY ACTIVE PRODUCT WORK IN THIS ORDER IS:
- mobile/**
- Expo / React Native runtime
- current Supabase contracts consumed by mobile
- official VEXFORGE card data/art already used by mobile
- project-provided VEXFORGE assets
- 2.5D game runtime / presentation / interaction

FROZEN / DO NOT TOUCH:
- unity/**
- src/** web portal
- public/** web portal assets
- old Unity control-plane/build work
- historical web implementation
- old Unity implementation
- prior Expo ZIP releases as implementation authorities
- public web references as gameplay/design inputs

Do NOT modify the web portal.
Do NOT replicate the web portal.
Do NOT modify Unity.
Do NOT migrate Unity.
Do NOT build Unity.
Do NOT use Unity scenes as active Expo content.
Do NOT use old web screens as mobile product designs.
Do NOT use previous ZIP releases as source of truth.

The current repository contains historical documentation that may still describe Unity as the Android runtime. That historical documentation is NOT the active implementation authority for this scoped task.
Create and obey the mobile-scoped authority file defined below.
Do not rewrite historical project records merely to hide the contradiction.

======================================================================
1. ABSOLUTE GIT / MAIN PERSISTENCE RULE
======================================================================

ALL IMPLEMENTATION WORK MUST BE PERFORMED ON THE USER'S OFFICIAL `main` BRANCH.

Do NOT:
- create a feature branch;
- use a worktree;
- create a detached HEAD implementation;
- maintain a parallel local-only runtime;
- build a private substitute repo;
- postpone all commits until the end of a long session.

Before EVERY implementation task:

1. `git fetch --prune origin`
2. verify current branch is `main`
3. verify worktree is clean
4. verify `HEAD == origin/main`
5. only then edit

Use the repository's established safe Git discipline.
Do not reset/rebase/merge/cherry-pick/force-push.
Do not use pull --rebase.

After EACH bounded implementation milestone:

1. run targeted tests/audits;
2. write/update the session checkpoint;
3. `git add` only the intended files;
4. commit the coherent milestone;
5. `git push origin HEAD:main`;
6. verify the remote `main` contains the new commit;
7. only then begin the next milestone.

CRITICAL:
A local working directory is unavoidable as the transient editing environment, but NO COMPLETED WORK may remain only there.
There is NO "finish everything locally and push at the end" workflow.

If push to `origin/main` is unavailable or rejected:
- report the exact Git error immediately;
- do not continue a large unpushed implementation;
- do not create another branch/worktree as a workaround.

Quota loss must leave the repository with the latest completed milestone already committed and pushed to main.

======================================================================
2. SESSION CHECKPOINT — REQUIRED EVERY SESSION
======================================================================

Create/maintain:
`mobile/docs/SESSION_CHECKPOINT.md`

Every session MUST push this checkpoint to main before quota exhaustion or stopping.

Required fields:
- current SHA;
- remote main SHA;
- branch;
- worktree clean/dirty;
- completed milestone;
- files changed;
- assets generated;
- assets verified;
- tests executed;
- exact results;
- remaining gaps;
- exact next milestone;
- BUILD STATUS = NOT RUN unless explicitly authorized later.

Also create/maintain:
`mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`

This file must describe only what is actually in main.

======================================================================
3. ACTIVE EXPO SCOPE AUTHORITY
======================================================================

Create:
`mobile/docs/ACTIVE_EXPO_GAME_SCOPE.md`

It MUST state:

ACTIVE:
- Expo/mobile game runtime;
- current mobile code;
- current mobile Supabase consumers;
- official card data/art used by mobile;
- project-provided VEXFORGE assets;
- this execution order.

FROZEN:
- Unity;
- web portal;
- historical web/Unity implementations;
- old Expo ZIPs.

NO design decisions for this task may be imported from the web portal or Unity.

Also create/update a root:
`replit.md`

with the same scope and a direct pointer to this execution order and the active checkpoint.
This is a persistent instruction file in the official repository, not a local-only note.

======================================================================
4. EVIDENCE FIRST — AUDIT MAIN BEFORE EDITING
======================================================================

Before any feature work, inspect and record the REAL current state of main:

- mobile/package.json
- mobile/app.json / app.config.*
- current Expo SDK
- React Native
- React
- TypeScript
- Router
- Reanimated
- Worklets
- Gesture Handler
- mobile/game/** if present
- mobile/app/**
- mobile/components/**
- mobile/constants/experience.ts
- mobile/lib/supabase.ts
- mobile/lib/aiBattle.ts
- battle.tsx
- ForgeBattlefield
- ForgeFormationPreview
- current mobile assets
- all mobile verifiers
- all recent commits that actually touched mobile/**

Do not trust:
- chat claims;
- filenames;
- README claims;
- manifests alone;
- prior ZIP labels;
- a previous session's report.

The repository is the source of truth for persisted work.

Do NOT spend the entire session planning.
After the audit, immediately implement the smallest complete next milestone and push it.

======================================================================
5. DO NOT THROW AWAY THE REAL FOUNDATION
======================================================================

Preserve and reuse where valid:

- auth/session;
- Supabase client;
- service/repository layer;
- current navigation;
- collection;
- deck/formation loading;
- battle contract;
- BattleResult;
- BattleTurn;
- vexforge_battle_resolve;
- opponent discovery;
- replay data;
- official card artwork references;
- haptics;
- reduced motion;
- telemetry;
- error states.

The current battle screen is a real foundation, not to be discarded.
The current battle verifier is a contract to preserve, not a limitation to bypass.

Do NOT create a second rules engine.
Do NOT create a second economy engine.
Do NOT create local competitive settlement.
Do NOT invent rewards.
Do NOT invent card mechanics.
Do NOT create a parallel navigation system.

======================================================================
6. DEPENDENCY POLICY — NO BLOCKING MIGRATION
======================================================================

Do NOT automatically upgrade everything to latest.
Do NOT choose dependency versions by intuition.
Do NOT add incompatible Skia/Reanimated/Worklets combinations.

FIRST:
- inspect the actual SDK already in main;
- use the Expo-compatible dependency resolver;
- install only compatible versions;
- run typecheck and Expo Doctor.

If the required 2.5D stack works on the current Expo line, KEEP IT.

If a required capability cannot be implemented correctly on the current SDK because of a real compatibility constraint, migrate to SDK 57 through the official Expo upgrade path, in a SINGLE bounded milestone:
- update Expo using Expo's supported mechanism;
- run `expo install --fix`;
- run Expo Doctor;
- repair incompatibilities;
- commit and push the migration immediately;
- verify the remote main SHA;
- continue.

Do NOT migrate to SDK 58.
Do NOT use beta/canary.
Do NOT mix SDK major versions.

A dependency problem may block only the dependency milestone; it must NOT stop all other already-compatible game work from continuing.

======================================================================
7. THE PRODUCT — NOT A DASHBOARD
======================================================================

VEXFORGE is NOT:
- dashboard;
- card database browser;
- animated admin panel;
- slideshow;
- collection of fantasy screens;
- portal copied into an APK.

VEXFORGE IS:
WORLD
→ OBJECT
→ CARD
→ ACTION
→ CONSEQUENCE
→ INFORMATION

The HUD supports the world.
The world is not a background for the HUD.

======================================================================
8. 2.5D RUNTIME — THE ACTUAL GAME ENGINE LAYER
======================================================================

Extend the EXISTING mobile runtime.
Do NOT create a second app.

Use one coherent presentation/interaction runtime with modules for:
- scenes;
- layers;
- actors;
- camera;
- timeline;
- cards;
- battlefield;
- VFX;
- audio;
- pack opening;
- boss presentation;
- tutorial;
- QA.

Recommended location only after inspecting existing structure:
`mobile/game/**`

If `mobile/game/**` already exists, EXTEND IT.
Do not create `game-v2`, `game2d`, `prototype`, or another parallel engine.

======================================================================
9. WHAT “REAL 2.5D” MEANS
======================================================================

A finished 2.5D scene MUST contain:
- multiple visual layers;
- explicit depth ordering;
- independently animated actors/objects;
- camera state;
- timeline/state changes;
- VFX;
- audio cues;
- interaction or gameplay consequence;
- quality/performance budget.

Required layer classes:
BACK
MID
PLAYFIELD
ACTORS
FRONT_FX
HUD

A single JPG/PNG with pan, zoom, opacity or scale is NEVER sufficient.

======================================================================
10. ACTORS — FIX THE OLD FAILURE DIRECTLY
======================================================================

Actors must be built as independently animated components.

Allowed methods:
A. layered cutout
B. sprite/atlas/frame animation
C. procedural path/transform animation of separated actor parts

Minimum state machine:
idle
anticipation
attack
cast
hit
defend
stagger
status
death
victory
summon
phase

For a cutout actor, separate where practical:
- head;
- face/eyes;
- torso;
- arms;
- weapon;
- cloak/accessories;
- shadow;
- FX anchor.

A full-image scale/translate/rotate/fade is not a character animation.

If source art cannot be separated safely:
- derive a clearly classified asset if possible;
- otherwise record CONTENT_GAP;
- do not call the feature final.

======================================================================
11. CARD IDENTITY — CENTRAL GAME OBJECT
======================================================================

Cards are the central identity of VEXFORGE.

Official card artwork remains canonical.
Never repaint it.

Create/reuse a presentation definition that supports:
- idle presence;
- focus;
- lift;
- tilt;
- parallax;
- reveal;
- summon presentation;
- attack presentation;
- cast presentation;
- hit reaction;
- status treatment;
- death presentation;
- camera focus;
- VFX mapping;
- audio mapping.

Mechanics are read from authoritative data.
The presentation layer cannot invent mechanics.

======================================================================
12. BATTLEFIELD — FIRST AND HIGHEST PRIORITY
======================================================================

The current ForgeBattlefield and battle.tsx are the foundation.

Evolve them in place into a real 2.5D battlefield.

Minimum player experience:

NEXUS
→ ARENA
→ formation
→ start real battle
→ battlefield expands into game space
→ actors appear in layered depth
→ attack event executes
→ camera responds
→ actor animates
→ VFX responds
→ audio responds
→ authoritative result appears
→ victory/defeat presentation
→ return to world.

This is the FIRST acceptance vertical slice.

Do not spend multiple sessions polishing menu surfaces before this exists.

======================================================================
13. AUTHORITATIVE BATTLE PIPELINE
======================================================================

KEEP:
PLAYER INPUT
→ SUPABASE
→ BattleResult / BattleTurn
→ presentation director
→ timeline
→ animation
→ camera
→ VFX
→ audio
→ haptics

Presentation must NEVER calculate:
- damage;
- winner;
- rewards;
- ownership;
- economy settlement.

Every gameplay-representing visual consequence must have an authoritative source event.
Ambient effects may exist independently but must be clearly ambient.

======================================================================
14. BATTLE EVENT PRESENTATION
======================================================================

Implement stateful presentation for:

ATTACK
anticipation → movement → trail/projectile/melee → impact → hit reaction → recovery

DEFENSE
stance → shield/guard → impact → deformation/reaction → recovery

CRITICAL
camera emphasis → unique VFX → audio → haptic

POISON
persistent status treatment → tick → removal/expiration

BURN
heat/fire/distortion treatment

FREEZE
frost/crystal treatment

STUN
impact → stagger → status treatment

HEAL
energy/transfer treatment → restoration response

SUMMON
arrival/portal → reveal → idle

BOSS PHASE
warning → camera → environment response → phase state → audio/VFX

Never invent a gameplay event the server did not return.

======================================================================
15. CAMERA DIRECTOR
======================================================================

Implement a real 2.5D camera state system:
- idle;
- focusActor;
- focusCard;
- follow;
- push;
- pull;
- pan;
- depth shift;
- impact shake;
- reveal;
- victory;
- defeat;
- pack reveal.

Camera movement must operate over the scene/layers/actors.
A background zoom is not a camera system.

======================================================================
16. TIMELINE / EVENT DIRECTOR
======================================================================

Create a data-driven timeline system supporting tracks for:
- actor animation;
- camera;
- VFX;
- audio;
- haptics;
- HUD acknowledgement.

Each event needs:
- start;
- duration;
- target;
- easing/interpolation;
- completion;
- skip/cancel behavior;
- reduced-motion behavior.

Replay replays the resolved presentation events only.
Never recalculate combat locally.

======================================================================
17. PACK OPENING — REAL INTERACTIVE EXPERIENCE
======================================================================

Second acceptance vertical slice:

NEXUS
→ VAULT/STORE
→ pack selection
→ chamber/space transition
→ pack focus
→ seal activation
→ energy build
→ environment reaction
→ seal rupture
→ silhouette/materialization
→ card reveal
→ identity reveal
→ ownership acknowledgement
→ collection update.

This must be an interactive timeline with real actor/layer states, camera, VFX, audio and haptics.

A slideshow is not acceptable.

======================================================================
18. BOSS — REAL 2.5D ENTITY
======================================================================

Third acceptance vertical slice:

WORLD
→ boss chamber
→ boss reveal
→ actor animation
→ attack/phase presentation from authoritative events
→ victory/defeat.

A single portrait enlarged on screen is not a finished boss.

If a canonical boss lacks separable source art:
- derive a legitimate 2.5D treatment if technically feasible;
- otherwise mark CONTENT_GAP;
- continue other systems.

No client settlement.

======================================================================
19. NEXUS / WORLD
======================================================================

Use the existing VEXFORGE identity tokens in experience.ts.

Existing domains remain the source identity:
- FOJA/NEXUS;
- ARENA;
- ARCHIVO;
- FORJA;
- LEGADO.

Do NOT turn them into dashboard tabs.

Each place should eventually have:
- depth layers;
- ambient movement;
- meaningful object/hotspot;
- camera behavior;
- soundscape;
- transition.

Use only canonical/project-provided world content.
Do not invent lore to fill empty space.

======================================================================
20. TUTORIAL — PLAYABLE, NOT TOOLTIP-ONLY
======================================================================

Teach through action:
- inspect a card;
- build/confirm formation;
- enter battle;
- react to an attack;
- see status effect;
- use ability where authoritative data permits;
- observe result;
- understand reward/collection loop.

Tooltips support learning.
Tooltips are not the gameplay.

======================================================================
21. VFX / SKIA
======================================================================

Use the Expo-compatible rendering stack actually supported by the resolved SDK.

Skia may be used for:
- particles;
- masks;
- gradients;
- procedural shaders;
- trails;
- distortion;
- runes;
- light sweeps;
- status effects;
- card foil treatment where appropriate.

Use bounded pools/lifetimes.
Do not create unbounded React particle views.

======================================================================
22. AUDIO / VOICE
======================================================================

Create/use a GameAudioDirector with:
- music;
- ambience;
- combat;
- UI;
- voice;
- cinematic;
- boss.

Voice generation may use Replit-managed generation capabilities if available in the active environment.

IMPORTANT:
The runtime must not depend on a live AI service to start.
Generated audio becomes a local asset after creation.
Register/hash every generated file.

If voice production is not available for a specific scene:
mark VOICE_PENDING;
continue engineering;
do not pretend the voice exists.

======================================================================
23. IMAGE / ASSET PRODUCTION
======================================================================

Use Replit's available image generation for NON-CANONICAL production:
- environment layers;
- midground/foreground layers;
- props;
- ceremonial objects;
- non-canonical actor layers;
- VFX source textures;
- loading art.

Never replace official card artwork.

Every generated asset requires:
- id;
- source;
- purpose;
- prompt/definition;
- hash;
- classification.

Classifications:
OFFICIAL
GENERATED
DERIVED
RUNTIME
MISSING
PLACEHOLDER
VOICE_PENDING

Never silently promote MISSING/PLACEHOLDER/VOICE_PENDING to FINAL.

======================================================================
24. NO GENERIC FALLBACKS
======================================================================

Forbidden as final output:
- random fantasy backgrounds;
- universal purple glow magic;
- universal red attack glow;
- stock dashboards;
- generic fantasy UI;
- arbitrary names;
- fabricated lore;
- giant card image used as a boss;
- whole-image zoom called animation.

If a fallback is required to keep the code runnable:
label it FALLBACK and keep it outside the final acceptance status.

======================================================================
25. PERFORMANCE / ANDROID FEASIBILITY
======================================================================

The project uses 2.5D specifically to remain feasible on Android.

Use:
- bounded caches;
- image downscaling;
- lazy loading;
- scene lifecycle release;
- sprite atlases where useful;
- bounded particle pools;
- limited concurrent animation;
- quality tiers.

Quality tiers affect PRESENTATION ONLY.
Never change game rules for performance.

======================================================================
26. AUTOMATED QA — MAKE FALSE COMPLETION IMPOSSIBLE
======================================================================

Create/extend:
`scripts/verify-mobile-game-runtime.mjs`

It must detect at least:
- cinematic composed only of image assets without timeline/runtime;
- actor without animation state/clip definition;
- scene without multiple layers;
- scene without camera behavior;
- battle event without presentation mapping;
- pack opening without timeline;
- boss without presentation sequence;
- voice reference without voice asset;
- broken asset references;
- placeholder presented as final;
- missing provenance/hash;
- orphaned timeline;
- orphaned VFX;
- orphaned audio;
- local competitive rules calculation;
- local economy settlement.

Statuses:
IMPLEMENTED
PARTIAL
MISSING
BLOCKED
VERIFIED
UNVERIFIED

Never convert PARTIAL into IMPLEMENTED.

======================================================================
27. DEV GAME LAB
======================================================================

Create a development-only inspection route inside mobile.

It is NOT production navigation.

It must let QA trigger/inspect:
- scene layers;
- actors;
- animation states;
- camera states;
- timelines;
- battle events;
- VFX;
- audio cues;
- pack opening;
- boss presentation.

This is a proof tool for the runtime, not a product dashboard.

======================================================================
28. SESSION TASK ORDER — USE MANY SESSIONS, BUT LEAVE WORK ON MAIN
======================================================================

SESSION 01
REAL REPO AUDIT + ACTIVE EXPO SCOPE
→ commit/push main

SESSION 02
DEPENDENCY ALIGNMENT ONLY
→ commit/push main

SESSION 03
SCENE RUNTIME CORE
→ commit/push main

SESSION 04
LAYERED SCENES
→ commit/push main

SESSION 05
ACTOR/ANIMATION RUNTIME
→ commit/push main

SESSION 06
CAMERA + TIMELINE
→ commit/push main

SESSION 07
BATTLEFIELD VERTICAL SLICE
→ commit/push main

SESSION 08
BATTLE EVENT PRESENTATION
→ commit/push main

SESSION 09
CARD PRESENTATION
→ commit/push main

SESSION 10
VFX
→ commit/push main

SESSION 11
PACK OPENING
→ commit/push main

SESSION 12
BOSS
→ commit/push main

SESSION 13
NEXUS/WORLD
→ commit/push main

SESSION 14
TUTORIAL
→ commit/push main

SESSION 15
AUDIO / VOICE
→ commit/push main

SESSION 16
PERFORMANCE
→ commit/push main

SESSION 17
VISUAL QA
→ commit/push main

SESSION 18
INTEGRATION QA
→ commit/push main

A session may complete multiple tasks if quota allows, but EVERY completed milestone must already be committed and pushed before continuing.

======================================================================
29. FIRST PRIORITY — DO NOT LOSE THE HEART OF THE GAME
======================================================================

Do NOT spend the next sessions polishing Store, Economy, Social or profile dashboards first.

The first proof of success is BATTLE.

The first acceptance video/inspection should show:

NEXUS
→ ARENA
→ battlefield
→ actor movement
→ attack
→ impact
→ reaction
→ VFX
→ audio
→ server result
→ victory/defeat

If that does not look and behave like a game, stop polishing menus.

======================================================================
30. BUILD CONTROL
======================================================================

DO NOT run:
- EAS preview;
- APK;
- AAB;
- store deployment;
- production deployment.

The user explicitly wants the runtime hardened before compilation.

Allowed:
- dependency install;
- typecheck;
- Expo Doctor;
- static audits;
- unit/integration tests;
- dev runtime;
- Game Lab.

The build gate will be handled later by explicit instruction.

======================================================================
31. MAIN-BRANCH COMPLETION PROTOCOL
======================================================================

At the END of EVERY session, BEFORE quota exhaustion:

1. stop beginning new work;
2. finish the current atomic task;
3. run its targeted validation;
4. update SESSION_CHECKPOINT.md;
5. `git status --short`
6. `git add ...`
7. `git commit -m "feat(mobile): <coherent milestone>"`
8. `git push origin HEAD:main`
9. verify the pushed commit is on origin/main;
10. report the exact SHA.

No exceptions for planned feature work.

If quota reaches its limit unexpectedly:
- the latest already-pushed commit remains the project state;
- the next session resumes from that SHA;
- no local-only feature should be considered complete.

======================================================================
32. FINAL REPORT FORMAT
======================================================================

Return EXACTLY:

CURRENT LOCAL SHA:
CURRENT REMOTE MAIN SHA:
BRANCH:
WORKTREE CLEAN:

EXPO SDK:
REACT NATIVE:
REACT:
TYPESCRIPT:

TYPECHECK:
PASS/FAIL/NOT RUN

EXPO DOCTOR:
PASS/FAIL/NOT RUN

SCENE RUNTIME:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

2.5D WORLD:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

ACTOR ANIMATION:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

CAMERA:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

TIMELINE:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

BATTLEFIELD:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

BATTLE PRESENTATION:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

CARD PRESENTATION:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

VFX:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

PACK OPENING:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

BOSS:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

NEXUS/WORLD:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

TUTORIAL:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

AUDIO:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

VOICE:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

PERFORMANCE:
IMPLEMENTED/PARTIAL/MISSING/BLOCKED/VERIFIED/UNVERIFIED

SUPABASE AUTHORITY:
PRESERVED/BROKEN/UNVERIFIED

BUILD:
NOT RUN

APK:
NOT RUN

AAB:
NOT RUN

IMPLEMENTED THIS SESSION:
...

FILES CHANGED:
...

ASSETS GENERATED:
...

ASSETS VERIFIED:
...

REMAINING GAPS:
...

EXACT NEXT MILESTONE:
...

======================================================================
33. ABSOLUTE HONESTY RULE
======================================================================

NO static JPG = cinematic.
NO whole-image zoom = character animation.
NO parallax background = gameplay.
NO giant card = boss entity.
NO manifest = implementation proof.
NO PASS message = build proof.
NO chat claim = repository evidence.

If it is not in the official main branch, it is not a completed project milestone.

======================================================================
34. FINAL ACCEPTANCE FOR THIS ACTIVE EXPO PROJECT
======================================================================

The active project is successful when the player can:

ENTER WORLD
→ interact with a place/object
→ enter a real battlefield
→ see independently animated actors
→ see camera response
→ see event-driven VFX
→ hear corresponding audio
→ observe authoritative battle outcome
→ replay presentation
→ open a pack interactively
→ encounter a boss entity with identity
→ learn mechanics by playing
→ return to the world.

The runtime must feel like VEXFORGE.
It must not feel like a dashboard with fantasy artwork.

END OF ORDER.
