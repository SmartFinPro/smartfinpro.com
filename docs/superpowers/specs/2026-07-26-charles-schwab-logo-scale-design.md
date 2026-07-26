# Charles Schwab sidebar logo scale

**Date:** 26 July 2026  
**Status:** Approved direction, awaiting specification review

## Goal

Increase the visible Charles Schwab logo in the Broker-V2 sidebar from roughly
60 px to approximately 110 px without changing the already-approved eToro
wordmark or physically rewriting the supplied brand asset.

## Design

The existing logo resolver will keep preferring `{slug}-seeklogo.*` files. It
will additionally identify the `charles-schwab` seeklogo as a square lockup.
The wordmark card will render that lockup inside a fixed, overflow-hidden
presentation area and apply a Charles-Schwab-only visual scale. The transparent
padding in the PNG absorbs the crop, so the complete blue square and lettering
remain visible.

Other seeklogo files retain the existing full-width, aspect-ratio-preserving
wordmark treatment. The source PNG remains unchanged.

## Acceptance criteria

- The visible blue Charles Schwab square is approximately 105–110 px high.
- The complete blue square and both lines of lettering remain visible.
- The logo stays horizontally centered in the Expert Review card.
- eToro retains its existing 234 × 78 px wordmark presentation.
- A server-rendering unit test distinguishes the Charles Schwab square-lockup
  treatment from the default eToro wordmark treatment.
- The Charles Schwab review renders without browser-console errors at desktop
  width.

## Verification

Follow red-green TDD for the sidebar markup, then run the relevant sidebar and
layout unit tests, TypeScript, Broker-V2 guard, SEO gate, and a desktop browser
comparison against eToro.
