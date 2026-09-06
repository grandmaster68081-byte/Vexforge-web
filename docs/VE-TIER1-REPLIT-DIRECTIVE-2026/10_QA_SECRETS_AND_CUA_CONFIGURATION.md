# VEXFORGE — QA ACCOUNT / SECURE TEST CONFIGURATION

## QA identity

Email:
`cristiangalvez815@gmail.com`

Password:
**NOT INCLUDED.**

The owner must add/provide the password through Replit Secrets. Do not request the password in a normal chat message when a secure secret mechanism is available.

## Recommended environment variables

```text
VEXFORGE_QA_EMAIL=cristiangalvez815@gmail.com
VEXFORGE_QA_PASSWORD=<stored in Replit Secrets>
```

## Usage policy

The QA account exists only to exercise the VEXFORGE application in a controlled testing context.

Use it for:
- authentication checks;
- route coverage;
- collection inspection;
- deck flow verification;
- profile/progression inspection;
- non-destructive economy UI inspection;
- battle entry and safe test flows;
- visual regression checks;
- state consistency checks.

Do not use it to:
- move real funds;
- trigger irreversible ownership changes;
- create uncontrolled production transactions;
- disclose credentials/tokens;
- print session cookies;
- weaken RLS/auth to simplify testing.

## Credential hygiene

Never:
- commit the password;
- put the password in prompts saved to the repository;
- include it in screenshots;
- echo it in shell output;
- expose it to client JavaScript;
- store it in localStorage/sessionStorage;
- paste auth tokens into documentation.

## Test-run evidence

Reports should state:
- QA account used: YES/NO
- browser/app testing used: YES/NO
- flow tested
- outcome
- limitations

Never include the actual password or token.
