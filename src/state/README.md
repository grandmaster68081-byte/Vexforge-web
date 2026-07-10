# state/

Reserved for cross-domain global state (e.g. current authenticated player),
once auth exists. Right now every domain hook manages its own local state
(`useState` inside `src/domains/<name>/use<Name>.ts`), which is correct while
there's no session-wide state to share. Don't add a global store speculatively
— add it when a second domain actually needs to read state that a different
domain's hook owns.
