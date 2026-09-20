# STORE / LEGAL / COMPLIANCE DECLARATIONS · V15

This document is a product configuration and review checklist, not legal advice.

## Apple App Store

For digital content, game currency, levels, premium functionality and similar in-app digital goods, the current App Store guidance requires the applicable In-App Purchase mechanism. Apple also requires disclosure of the odds for paid randomized virtual items. Apple has specific restrictions and conditions for NFT/crypto-related functionality, including limits around what ownership can unlock in-app.

VEXFORGE rule: never hide an external payment mechanism inside an in-app digital purchase flow. Final implementation must use the platform-appropriate entitlement path and be reviewed against the exact storefront and current Apple rules.

Source: https://developer.apple.com/app-store/review/guidelines/

## Google Play

Google Play's blockchain-based content policy requires disclosure in the Financial features declaration when an app sells or enables users to earn tokenized digital assets. Google also prohibits promoting or glamorizing earning potential. For non-gambling apps outside applicable pilots, monetary value must not be accepted for a chance to obtain an NFT of unknown value, and NFT gamification has additional restrictions.

VEXFORGE rule: product copy must describe gameplay utility and ownership accurately, never promise profit/ROI, and never present a monetization loop as guaranteed income.

Sources:
https://support.google.com/googleplay/android-developer/answer/13607354
https://support.google.com/googleplay/android-developer/answer/13849271

## Ads / consent

Unity LevelPlay privacy controls require appropriate consent configuration for supported networks. The current Unity documentation states that consent management must be configured before sharing permission states with networks and lists SDK 9.5.0+ as a prerequisite for the referenced advanced consent settings.

VEXFORGE rule: rewarded ads may be the primary optional value exchange; no ad interrupts a live battle; final privacy/consent behavior is configured from real production identifiers.

Source: https://docs.unity.com/en-us/grow/levelplay/sdk/flutter/regulation-advanced-settings

## Treasury

Operator-supplied BSC USDT BEP20 address:

`0x29B2907d6E10BeB2becb9bA82f2b6af04815c403`

It is intentionally disabled until manual network/address verification.

## No ROI promise

VEXFORGE product copy must not promise a minimum ROI, guaranteed payback period, guaranteed token appreciation, guaranteed withdrawals or guaranteed income.

## Randomized packs

Pack content is server-authoritative. Client-side rolling is forbidden. Platform-required odds disclosure must be shown before the purchase decision where applicable.

## Release disclaimer

A correct declaration template is not a legal conclusion. Final legal review remains necessary for the jurisdictions, storefronts, tokenization model and payment rails actually used at launch.
