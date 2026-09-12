# REPLIT — CURRENT CAPABILITIES / LIMITS RELEVANT TO VEXFORGE

Verified against current Replit documentation available during preparation of this package.

## 1. Agent can do more than code generation
Replit describes Agent as able to inspect project structure, edit code, run commands and tests, debug issues, update designs, connect services, and guide workflows.

## 2. Browser/App Testing exists
Replit documents App Testing as a capability that lets Agent test an app automatically in a browser. Its Agent 3 changelog describes a self-test/reflection loop that can identify issues and fix them.

This supports the VEXFORGE requirement that QA be performed from the running application, not only from source code.

## 3. Code Optimizations exists
Current Agent Advanced settings include Code Optimizations as a separate capability for reviewing and improving code as Agent works.

## 4. Agent modes matter
Replit's current docs describe Lite, Economy, and Power modes. Power is intended for complex, larger, production-grade work. App Testing and Code Optimizations are available in Advanced settings.

For major VEXFORGE architectural transformations, prefer the most capable available mode consistent with the project's budget/plan.

## 5. Secrets are the correct place for QA credentials
Replit Secrets stores sensitive values as encrypted environment variables. Use Secrets for the QA password and any other sensitive credential.

Never put the QA password into:
- source code;
- markdown;
- screenshots;
- git;
- client-side JavaScript;
- logs;
- local/session storage.

## 6. Production validation is different from Preview
Replit's documentation distinguishes Preview/development URLs from published apps and notes that production Secrets may need to be configured separately.

Therefore, do not assume a Preview result proves the published app is identical.

## 7. Limits / honesty
Agent is powerful but not equivalent to a human physically operating every device, external service, wallet, or real-world condition.

VEXFORGE should therefore use:

`AUTOMATED TESTING + AGENT REPAIR + HUMAN FINAL VALIDATION`

rather than pretending that one agent session can prove everything.

## Source links

Replit Agent / build with Agent:
https://docs.replit.com/learn/build-with-agent

Replit Agent modes / App Testing / Code Optimizations:
https://docs.replit.com/replitai/assistant/

Agent 3 / App Testing reflection loop:
https://docs.replit.com/updates/2025/09/12/changelog

Replit Secrets:
https://docs.replit.com/core-concepts/project-editor/app-setup/secrets

Replit troubleshooting / production secrets:
https://docs.replit.com/build/troubleshooting

Replit development URLs:
https://docs.replit.com/core-concepts/project-editor/development-urls
