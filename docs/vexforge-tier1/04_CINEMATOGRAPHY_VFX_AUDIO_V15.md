# CINEMATOGRAPHY · VFX · AUDIO · V15

## One event stream

The same canonical `BattleEvent` drives camera, VFX, audio and encounter dressing. This avoids timing drift between independent gameplay and presentation scripts.

## Camera language

- attack/strike: restrained impact movement;
- boss/raid: short reveal/focus pull;
- victory/defeat: a finite finish reveal;
- no arbitrary battle-end timer;
- no camera movement when the canonical stage is absent.

## VFX language

V15 uses short bursts rather than a continuous particle storm. Events produce controlled crimson, arcane blue or gold responses according to event vocabulary. A small concurrency cap prevents runaway object creation on low-RAM phones.

## Audio language

Attack, guard, shield, impact, reveal, reward, victory and defeat cues are provided as resource assets. Silence is a valid fallback. Audio is never used to imply an event that the server did not report.
