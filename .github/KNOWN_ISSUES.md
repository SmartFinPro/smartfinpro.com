# Known Issues — March 2026 Release

## TypeScript Strict Mode Errors (20 total)

**Status:** Known, non-blocking — all tests pass, build succeeds
**Release:** feat/quality-upgrades-march-2026
**Date:** 2026-03-15

These errors exist in `npx tsc --noEmit` but do NOT block the Webpack build or runtime.

### landing/ Submodule (10 errors)

The `landing/` submodule has import mismatches with the main codebase.
These will be fixed when the landing submodule is next synced.

| File | Error | Type |
|------|-------|------|
| `landing/app/(marketing)/layout.tsx` | Named import for default exports (Header, ExitIntentPopup, CookieConsentBanner) | TS2614/TS2724 |
| `landing/app/(marketing)/page.tsx` | Named import for Hero | TS2614 |
| `landing/app/(marketing)/[market]/page.tsx` | Named import for Hero, UKBrokerHeroSlider | TS2614 |
| `landing/app/layout.tsx` | Named import for DevCacheBuster | TS2614 |
| `landing/app/(dashboard)/dashboard/page.tsx` | ConversionFunnel props mismatch | TS2322 |
| `landing/components/marketing/report-layout.tsx` | Missing modules: debt-relief-mini-recommender, tracked-affiliate-link | TS2307 |

### Main Codebase (10 errors)

| File | Error | Type |
|------|-------|------|
| `__tests__/unit/fx-dynamic.test.ts` (4x) | Intentional test comparisons with mismatched literal types | TS2367 |
| `app/api/genesis/affiliate-rates/route.ts` | String not assignable to market union type | TS2345 |
| `app/api/genesis/auto-partner-preview/route.ts` | String not assignable to market union type | TS2345 |
| `components/dashboard/affiliate-scan-button.tsx` | Implicit any on parameter | TS7006 |
| `components/dashboard/genesis-edit-modal.tsx` | Implicit any on parameter | TS7006 |
| `components/dashboard/system-settings.tsx` (2x) | Unknown type on sort comparator | TS18046 |

### Resolution Plan

- **landing/ errors:** Fix in next landing submodule sync (separate PR)
- **fx-dynamic.test.ts:** Intentional — tests verify runtime behavior with invalid inputs
- **Genesis API routes:** Add type assertion for market parameter
- **Dashboard components:** Add explicit types to callback parameters
