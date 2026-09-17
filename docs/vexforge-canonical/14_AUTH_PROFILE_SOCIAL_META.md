# 14 — AUTH / PROFILE / SOCIAL / META

## Auth

`mobile/app/auth.tsx` consume `signIn`, `signUp`, OAuth Google/provider, reset y signout. `mobile/lib/supabase.ts` mantiene sesión persistente y refresh. El root/tab layout redirige por sesión.

## Profile/progress

`profile.tsx` consume profile, progress, stats, rank, achievements, settings y cosmetics. Meta (`meta.tsx`) reúne settings, cosméticos, reliquias, NFT/referrals y otras superficies declaradas por loaders.

## Social/clans

`social.tsx` y `loadSocialSnapshot` cubren friends, direct challenges y clans. Acciones observadas incluyen send/accept/decline friend, send/respond challenge, create/join/leave clan y start guild war.

## Backend representativo

`players`, `player_progress`, `player_achievements`, `player_settings`, `clans`, `clan_members`, `friendships`, `direct_challenges`, `guild_wars`, `cosmetics`, `equipped_cosmetics`, `relics`, `player_relics` y tablas de referrals/ad stats.

No se incluyen credenciales, emails de QA ni valores de sesión en esta capa. Estado: `IMPLEMENTED_UNVERIFIED`, con permisos live aún `EVIDENCE_REQUIRED`.
