# Research Library broker logo assets

Downloaded and visually checked on 2026-07-19 for the US trading-platforms
Research Library pilot.

## Runtime assets

Use the lossless WebP files under:

`/public/images/brokers/research/display/<product-slug>.webp`

The runtime assets are **tight-cropped**: `scripts/research/normalize-logos.mjs`
trims the transparent margin off every logo so the glyph fills ~100% of its own
asset. (An earlier revision padded them onto a uniform 360×112 canvas; the glyph
then filled only 40–64% of the height and rendered far too small at any slot
height, so the padding was removed.) The logo art itself is never recolored,
redrawn, or altered — only the surrounding transparent margin is cropped.

Because trimming leaves each logo with its own aspect ratio, the real pixel
dimensions are recorded in the generated manifest
`components/research/logo-dims.ts` and fed to `next/image` as intrinsic
dimensions. `components/research/BrokerLogo.tsx` then sizes each logo purely via
CSS — a fixed slot **height** plus a **max-width**, with `object-contain`
`object-left` — so a compact mark fills the slot height and a very wide wordmark
is bounded by max-width and sits a touch shorter. The images are served
`unoptimized` (they are already hand-optimised, and the Next optimiser otherwise
cached a stale pre-trim aspect ratio).

Re-run after changing any asset: `node scripts/research/normalize-logos.mjs`
(idempotent — trims + rewrites `logo-dims.ts`).

| Product | Runtime path | Source asset |
| --- | --- | --- |
| Fidelity | `/images/brokers/research/display/fidelity.webp` | `fidelity.svg` |
| Charles Schwab | `/images/brokers/research/display/charles-schwab.webp` | `charles-schwab.svg` |
| Interactive Brokers | `/images/brokers/research/display/interactive-brokers.webp` | `interactive-brokers.svg` |
| tastytrade | `/images/brokers/research/display/tastytrade.webp` | `tastytrade.svg` |
| Robinhood | `/images/brokers/research/display/robinhood.webp` | `robinhood-current.png` |
| Webull | `/images/brokers/research/display/webull.webp` | `webull.svg` |
| E*TRADE | `/images/brokers/research/display/etrade.webp` | `etrade.svg` |
| Merrill Edge | `/images/brokers/research/display/merrill-edge.webp` | `merrill-edge.svg` |
| eToro | `/images/brokers/research/display/etoro.webp` | `etoro.svg` |

## Provenance

| Asset | Retrieval source | Origin noted by source |
| --- | --- | --- |
| `fidelity.svg` | https://logotyp.us/file/fidelity-investments.svg | Fidelity Investments identity; visually checked against Fidelity US materials |
| `fidelity-white.png` | https://www.fidelity.com/intlacct/images/Footer_Logo.png | Fidelity.com official white footer logo; retained as a dark-surface alternative |
| `charles-schwab.svg` | https://commons.wikimedia.org/wiki/File:Charles_Schwab_Corporation_logo.svg | Charles Schwab / schwab.com |
| `interactive-brokers.svg` | https://commons.wikimedia.org/wiki/File:Interactive_Brokers_Logo_(2014).svg | Interactive Brokers company website |
| `tastytrade.svg` | https://logotyp.us/file/tastytrade.svg | tastytrade wordmark; visually checked against tastytrade.com |
| `robinhood-current.png` | https://commons.wikimedia.org/wiki/File:Robinhood_Markets_logo.png | Robinhood Markets, 2024 identity |
| `robinhood.svg` | https://commons.wikimedia.org/wiki/File:Robinhood_(company)_logo.svg | Robinhood press identity, retained as a legacy vector alternative |
| `webull.svg` | https://en.wikipedia.org/wiki/File:Webull_logo.svg | Webull wordmark |
| `etrade.svg` | https://en.wikipedia.org/wiki/File:ETrade_Logo.svg | Current E*TRADE from Morgan Stanley wordmark |
| `merrill-edge.svg` | https://en.wikipedia.org/wiki/File:Merrill_Logo_2019.svg | Current Merrill / Bank of America company identity used by Merrill Edge |
| `etoro.svg` | https://commons.wikimedia.org/wiki/File:Etoro_logo.svg | eToro.com |

The initially found red-and-blue Fidelity Worldwide Investment logo was
rejected because it is not the US Fidelity Investments identity used by this
pilot.

## Trademark usage

These files contain third-party trademarks. They are stored for nominative,
editorial identification of products in an independent comparison. Do not
recolor, distort, combine with SmartFinPro branding, or imply endorsement.
Where a source page provides additional trademark restrictions, those continue
to apply.
