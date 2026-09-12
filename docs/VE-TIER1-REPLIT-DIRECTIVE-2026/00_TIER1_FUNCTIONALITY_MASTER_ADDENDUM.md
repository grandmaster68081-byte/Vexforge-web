# VEXFORGE — TIER-1 FUNCTIONALITY + VISUAL TRANSFORMATION ADDENDUM
## VE-T1-FULLSTACK-REPAIR-2026

> **This file extends, and does not replace, `01_REPLIT_IMPLEMENTATION_DIRECTIVE.md`.**
> It adds an explicit mandate for functional repair, browser/in-app verification, regression control, security hygiene, and continuous autonomous progress within Replit Agent's real capabilities.

---

## 0. NORTH STAR

The objective is not to make VEXFORGE a nicer-looking app.

The objective is to take the existing product toward a **Tier-1 TCG/CCG experience** in two simultaneous tracks:

**TRACK A — EXPERIENCE / GAME FEEL**
- Transform the five primary domains from administrative surfaces into game spaces.
- Build a coherent visual language, motion language, interaction language, and world language.
- Make FOJA, BATALLA, CARTAS, MAZO and PERFIL feel like five places inside one game.

**TRACK B — FUNCTIONALITY / QUALITY**
- Find and repair broken routes, dead controls, exceptions, race conditions, loading failures, stale state, empty/error-state defects, data-binding problems, auth/session issues, visual regressions, navigation loops, orphaned screens, and other defects that can be verified from code, logs, tests, or the running application.
- Verify fixes through the actual application where Replit's available browser/app-testing capability permits.
- Maintain a regression-resistant project after every meaningful change.

The target is a **working game experience**, not a visual prototype.

---

# 1. OPERATING PRINCIPLE

Treat every change as a three-part problem:

`EXPERIENCE → FUNCTION → VERIFICATION`

A screen is not finished when it looks correct.

A feature is not finished when its code compiles.

A route is not finished because it exists.

A domain is finished only when:

1. it looks and feels like VEXFORGE;
2. it is wired to the intended real route/state/data;
3. the major user paths can be exercised;
4. errors and edge states are handled;
5. the change does not regress other surfaces;
6. the implementation remains performant and maintainable.

---

# 2. REPLIT AGENT'S AUTHORITY

Within the normal permissions and tools available in the Replit environment, operate proactively rather than waiting for the user to discover every defect.

You are authorized to:

- inspect the repository;
- inspect configuration and dependencies;
- inspect routes and navigation;
- inspect Supabase integration code and data-access patterns;
- inspect logs and runtime errors;
- run existing tests and checks;
- add targeted tests where useful;
- run lint/type checks/build checks available to the project;
- use Preview / browser-based testing when available;
- exercise accessible user flows;
- identify defects;
- repair defects with the smallest safe change;
- refactor clearly harmful duplication or dead paths when supported by evidence;
- improve accessibility and mobile interaction quality;
- optimize obvious performance problems;
- improve loading/error/empty/skeleton states;
- fix navigation and state synchronization problems;
- continue the visual Tier-1 transformation from the benchmark directives.

Do **not** interpret this authority as permission to invent product rules or silently rewrite security-sensitive business logic.

Changes involving any of the following must be treated as high-risk and require an explicit plan plus human confirmation before changing business semantics:

- token/balance accounting rules;
- irreversible economic transactions;
- reward issuance rules;
- ownership/asset transfer rules;
- production destructive migrations;
- auth policy changes that broaden access;
- RLS changes that weaken protection;
- credential rotation or exposure;
- changes that could alter user-owned balances or inventory.

Bug fixes that preserve an already-established rule may be repaired when the rule is unambiguous and evidence-backed.

---

# 3. CONTINUOUS SELF-TESTING LOOP

Whenever App Testing / browser testing is available in the current Replit environment, use it as part of the implementation loop. Replit documents Agent App Testing as a browser-based self-test/reflection loop and its current Agent settings include App Testing and Code Optimizations in Advanced settings.

Preferred loop:

`INSPECT → PLAN → IMPLEMENT → RUN → TEST → OBSERVE → DIAGNOSE → REPAIR → RETEST → REGRESSION CHECK → CHECKPOINT`

Never stop at the first successful render if additional testing is available.

When browser/app testing is unavailable for a particular path:

- test what is possible;
- record what could not be verified;
- do not claim that path is verified.

This is a hard honesty requirement.

---

# 4. FUNCTIONAL AUDIT SCOPE

Audit the application at five layers.

## 4.1 ROUTING / NAVIGATION

Check for:

- dead links;
- routes that do not resolve;
- back-navigation traps;
- duplicate or conflicting routes;
- unexpected redirects;
- route guards that block valid states;
- routes opening the wrong domain;
- modal/sheet routes that cannot close;
- deep-link failures where applicable;
- navigation that loses selected state unexpectedly;
- navigation that shows stale data.

## 4.2 UI INTERACTION

Check every visible primary interaction that can reasonably be tested:

- buttons;
- cards;
- tabs;
- filters;
- sort controls;
- search;
- selectors;
- dialogs;
- drawers;
- back actions;
- CTA actions;
- collection/deck interactions;
- battle-entry actions;
- profile actions;
- economy/shop actions where non-destructive;
- tutorial/onboarding progression;
- reward claims where safe and testable.

A visible control that does nothing is a defect unless the UI explicitly communicates that it is locked/disabled and why.

## 4.3 DATA / STATE

Check for:

- loading forever;
- empty state incorrectly shown;
- data shown from the wrong user;
- stale cached values;
- state not updating after mutation;
- state updating before a mutation actually succeeds;
- inconsistent counts;
- duplicated items;
- missing items;
- broken pagination/infinite scroll;
- race conditions between auth and data loading;
- race conditions between navigation and asynchronous queries;
- inconsistent server/client state;
- optimistic UI without rollback;
- error state without recovery.

## 4.4 AUTH / SECURITY HYGIENE

Check for:

- auth loops;
- sessions expiring without graceful handling;
- protected routes exposed visually or functionally;
- sensitive values rendered in UI or logs;
- secrets accidentally committed;
- secrets placed in client-side code;
- unsafe local/session storage use for credentials;
- insecure API patterns;
- client-side authority over values that should be server-controlled;
- missing validation on sensitive actions.

Never place QA credentials, Supabase service-role keys, private keys, or passwords in source files, screenshots, markdown prompts, or public client code.

Use Replit Secrets for the QA credentials.

## 4.5 PERFORMANCE / RESILIENCE

Check for:

- slow initial render;
- oversized assets;
- repeated network calls;
- unnecessary rerenders;
- giant component state causing avoidable updates;
- animation loops that continue when not visible;
- memory pressure from images;
- scroll stutter;
- blocked interactions while noncritical resources load;
- unhandled promise rejections;
- crash loops;
- console errors/warnings that indicate real defects.

---

# 5. QA ACCOUNT / IN-APP VERIFICATION

A dedicated VEXFORGE QA account exists for testing.

QA EMAIL:
`cristiangalvez815@gmail.com`

The password MUST NOT be stored in this document.

The password MUST NOT be hard-coded.

The password MUST be supplied by the project owner through Replit Secrets or another secure secret mechanism supported by the environment.

Recommended secret keys:

`VEXFORGE_QA_EMAIL`
`VEXFORGE_QA_PASSWORD`

The email may be pre-populated as the value of `VEXFORGE_QA_EMAIL` because it is non-secret operational configuration; the password remains a secret.

Preferred behavior:

1. detect whether the QA secrets exist;
2. if the email secret is absent, the known QA email may be suggested as the value;
3. if the password secret is absent, request it through the secure Secrets mechanism rather than asking the owner to paste it into chat/code;
4. use the QA account only for test flows;
5. never expose the password in logs, UI, screenshots, commits, terminal output, or generated reports.

Do not create scripts that print credentials.

Do not log authentication tokens.

Do not copy session cookies/tokens into documentation.

---

# 6. IN-APP QA PLAYBOOK

The QA account is meant to broaden verification beyond static code inspection.

For each primary domain, perform a realistic user pass whenever the environment permits.

## FOJA

Test:
- initial load;
- visual idle state;
- vertical scroll;
- all primary hotspots;
- CTA transitions;
- return to FOJA;
- loading and error behavior;
- player-state-dependent content;
- motion stability;
- responsiveness to touch;
- absence of dead controls.

## BATALLA

Test:
- enter battle domain;
- choose available mode;
- matchmaking entry where safe;
- disabled/unavailable mode states;
- return/back flow;
- battle preparation state;
- error recovery;
- stale matchmaking state;
- post-battle return path if a safe test route exists.

Do not trigger irreversible or production-sensitive actions merely to prove a UI path.

## CARTAS

Test:
- collection load;
- search;
- rarity filter;
- faction filter;
- sort;
- opening a card detail;
- closing detail;
- owned/unowned states;
- quantity display;
- empty/no-match states;
- loading/error states;
- persistence when leaving and returning.

## MAZO / LA FORJA

Test:
- open deck list;
- create/edit flow if implemented;
- add/remove card where safe;
- deck validation;
- save/update;
- cancel/back;
- empty deck;
- invalid deck;
- persistence after returning;
- handoff from deck to battle.

## PERFIL / LEGADO

Test:
- profile loading;
- stats;
- progression;
- achievements;
- social/identity elements that are safe to inspect;
- return navigation;
- stale state;
- unauthorized/private information boundaries.

## SECONDARY SYSTEMS

Audit the flows that feed the five primary domains:

- World;
- Economy;
- ForgeFormation / battle systems;
- Missions;
- Rewards;
- Social;
- Events;
- Shop/Packs;
- Tutorial;
- other documented systems.

The rule is not "make every secondary system beautiful first".

The rule is:

`repair critical functionality + establish coherent integration + progressively upgrade presentation`.

---

# 7. DEFECT SEVERITY MODEL

Use this severity model for triage.

### P0 — BLOCKER
The app cannot boot, auth is impossible, data is catastrophically exposed/corrupted, or a primary core loop is unusable.

Action: stop lower-priority visual work and repair first.

### P1 — CRITICAL
A core domain or major flow cannot be completed reliably.

Examples:
- Battle cannot start;
- Collection cannot load;
- Decks cannot be saved;
- navigation traps;
- repeated runtime crashes.

Action: repair before substantial polish.

### P2 — MAJOR
Important functionality is broken but workaround exists.

### P3 — MODERATE
Localized UI/state/interaction defect.

### P4 — POLISH
Visual, animation, copy, spacing, microinteraction, or noncritical optimization issue.

Tier-1 visual work must continue, but P0/P1 defects take precedence over pure polish.

---

# 8. DEFECT RECORD FORMAT

For each nontrivial defect discovered, create or maintain a compact record with:

- ID;
- domain;
- severity;
- symptom;
- reproduction path;
- evidence/source;
- probable cause;
- change made;
- verification method;
- regression surfaces checked;
- unresolved limitations.

Example:

`BUG-BAT-014 | P1 | Battle CTA opens wrong route | QA browser test | route mapping mismatch | fixed route target | retested CTA + back flow | unresolved: real matchmaking not tested`

Do not inflate a report with speculative root causes. State only what evidence supports.

---

# 9. VISUAL + FUNCTIONAL WORK MUST CONVERGE

Do not create a beautiful disconnected shell and postpone integration indefinitely.

Every major visual transformation should use real routes, real data, or clearly isolated existing placeholders when real data is unavailable.

Example:

Bad:
`Create a beautiful card collection using hard-coded fake cards.`

Preferred:
`Preserve the existing collection query and RLS contract; redesign the presentation around real card records and real owned quantities; introduce a minimal adapter only where the UI needs a presentation model.`

---

# 10. GAME-FEEL LAYER

Once a functional surface is correct, raise it toward Tier-1 quality through:

- motion hierarchy;
- transition choreography;
- touch feedback;
- contextual highlights;
- idle animation;
- ambient VFX;
- depth/parallax;
- stateful lighting;
- card inspection motion;
- reward reveal motion;
- loading skeletons that match the final composition;
- error recovery that remains in-world;
- sound integration if the current architecture supports it.

Motion should communicate state, not merely decorate.

Examples:

`tap → response`
`open card → focal expansion`
`enter battle → scene transition`
`complete activity → reward feedback`
`return home → re-entry into the living hub`

---

# 11. RESPONSIVE / MOBILE-FIRST STANDARD

VEXFORGE is phone-first.

Test at narrow mobile widths whenever possible.

Minimum quality expectations:

- touch targets are comfortable;
- no accidental horizontal overflow;
- no clipped critical controls;
- readable text without zoom;
- safe-area awareness;
- consistent back behavior;
- scrolling is smooth;
- fixed HUD elements do not cover content;
- dialogs and sheets do not become unusable on small screens.

Do not optimize only for desktop Preview.

---

# 12. DESIGN SYSTEM GOVERNANCE

Any new screen or transformed screen must reuse or extend a single VEXFORGE visual system rather than inventing a new visual language.

Govern:

- typography;
- color tokens;
- spacing;
- corner language;
- frame language;
- card rarity language;
- iconography;
- buttons;
- chips/tags;
- states;
- elevation;
- borders;
- glows;
- animation timing;
- transition patterns.

The five domains can have different atmospheres while remaining unmistakably one game.

---

# 13. DATA / BACKEND PRESERVATION

Backend truth remains canonical.

Before changing a data interaction:

1. find the current data source;
2. understand its contract;
3. identify auth requirements;
4. identify RLS/policy assumptions;
5. inspect existing error handling;
6. preserve the established business meaning;
7. change only what is required.

Do not duplicate data models merely to simplify UI work.

Do not bypass RLS because a screen is inconvenient to implement.

Do not move privileged operations into the client.

---

# 14. CHECKPOINTS AND SAFE PROGRESSION

Use checkpoints after meaningful working milestones.

Recommended cadence:

`AUDIT CHECKPOINT`
`FUNCTIONAL REPAIR CHECKPOINT`
`FOJA V1 CHECKPOINT`
`BATALLA V1 CHECKPOINT`
`CARTAS V1 CHECKPOINT`
`FORJA V1 CHECKPOINT`
`PERFIL V1 CHECKPOINT`
`INTEGRATION CHECKPOINT`
`TIER-1 POLISH CHECKPOINT`
`RELEASE-CANDIDATE CHECKPOINT`

Do not combine dozens of unrelated changes into one untraceable rewrite.

---

# 15. HUMAN-IN-THE-LOOP LIMIT

The agent must be proactive, but it must not pretend to provide verification that requires a human when the available tools cannot establish it.

Examples of human-required or human-preferred checks may include:

- real physical-device feel beyond simulator/browser emulation;
- visual judgement at a subjective artistic bar;
- external wallet/financial transaction confirmation;
- device-specific crashes not reproducible in the available environment;
- real-world network conditions;
- final store-release validation;
- actions whose risk cannot be safely simulated.

For these cases:

`TEST WHAT YOU CAN → REPORT WHAT YOU COULD NOT → LEAVE A PRECISE HUMAN CHECK`

Do not mark a human-required scenario "PASS" based only on static inspection.

---

# 16. FINAL QUALITY GATE

A Tier-1 candidate build is not simply the one with the best screenshots.

It must score strongly across:

### FUNCTION
- critical routes work;
- primary actions work;
- data loads correctly;
- state transitions are coherent;
- errors recover;
- auth boundaries hold.

### EXPERIENCE
- player understands where they are;
- next action is discoverable;
- interaction feels responsive;
- returning to FOJA feels like returning home;
- systems reinforce each other.

### VISUAL
- clear focal hierarchy;
- strong art direction;
- depth;
- consistent materials;
- premium typography;
- controlled motion;
- no dashboard residue.

### ENGINEERING
- no obvious runtime errors;
- reasonable performance;
- no accidental secret exposure;
- no unnecessary duplication;
- maintainable components;
- checkpoints/reversibility.

### QA
- browser/app testing performed where available;
- QA account tested through allowed flows;
- regression checks performed;
- human-only checks explicitly recorded.

---

# 17. CURRENT REPLIT CAPABILITY NOTE

Use the current Replit Agent capabilities available in the project rather than assuming every session has identical tools or plan limits.

Current Replit documentation describes Agent as able to inspect projects, edit code, run commands/tests, debug issues, and work iteratively. Current Agent settings also expose App Testing for automatic browser testing and Code Optimizations; Replit's Agent 3 changelog describes browser self-testing with a reflection loop that can find and fix issues. See the source index in `09_REPLIT_CURRENT_CAPABILITIES_AND_LIMITS.md`.

Therefore this directive deliberately asks for **maximum practical autonomous verification**, not fictional full autonomy.

---

# 18. DEFINITION OF DONE

The project is not "done" because all five screens were visually restyled once.

The target is an iterative state where:

`VEXFORGE LOOKS LIKE A GAME`
+
`VEXFORGE BEHAVES LIKE A GAME`
+
`VEXFORGE IS TESTED LIKE A PRODUCT`
+
`VEXFORGE RETAINS ITS REAL DATA / RULES`
+
`VEXFORGE CAN CONTINUE ITERATING WITHOUT LOSING QUALITY`

That is the standard for this directive.
