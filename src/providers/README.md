# providers/

Empty on purpose. This is where a real auth provider (`AuthProvider.tsx`)
goes once Supabase Auth is wired — see `backend/blockers/README.md` and
`backend/pending/auth-and-writes.md`.

Not pre-filled with a stub context/provider because there is no real auth
config to base one on yet, and a fake provider that "looks connected" would
violate the project rule against simulating things as real.