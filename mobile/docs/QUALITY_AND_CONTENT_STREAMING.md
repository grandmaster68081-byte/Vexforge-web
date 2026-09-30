# Quality + Content Streaming

## Core APK
Runtime, state, navigation, battle presentation, card renderer, input, lightweight visual system, essential audio hooks.

## Remote content
Official card art and other large approved content may be streamed from the canonical storage system when data supplies the verified asset reference.

## Quality tiers
`LOW`, `MEDIUM`, `HIGH` tune visual budget only. A low-end device must not be forced to decode every high-resolution card, environment or effect.

## Cache
Use bounded caches. Do not preload the full card catalog at full resolution. Reuse visible card renderers and evict resources outside the active visual window.
