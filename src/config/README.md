# config/

Reserved for non-secret runtime config that isn't a Vite env var (feature
flags, route metadata, nav config extracted out of `App.tsx` once it grows).
Currently empty — `App.tsx`'s inline `NAV` array is small enough not to
warrant extraction yet.
