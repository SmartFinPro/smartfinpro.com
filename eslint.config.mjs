import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "module";

// Custom SmartFinPro rules — loaded via createRequire (CommonJS rules in ESM config)
const require = createRequire(import.meta.url);
const noRawMdxSerialize = require("./eslint-rules/no-raw-mdx-serialize.js");
const requireServiceClient = require("./eslint-rules/require-service-client.js");
const requireWidgetErrorBoundary = require("./eslint-rules/require-widget-error-boundary.js");

const sfpRulesPlugin = {
  rules: {
    "no-raw-mdx-serialize": noRawMdxSerialize,
    "require-service-client": requireServiceClient,
    "require-widget-error-boundary": requireWidgetErrorBoundary,
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── SmartFinPro Custom Rules ──────────────────────────────────────────────────
  // Phase 2: no-raw-mdx-serialize + require-service-client → error (cleanup done)
  // Phase 1 still: require-widget-error-boundary → warn (26 violations pending)
  {
    plugins: { sfp: sfpRulesPlugin },
    rules: {
      // Prevents _missingMdxReference crash in production — HARD ERROR
      "sfp/no-raw-mdx-serialize": "error",
      // Prevents silent auth failures in server-only contexts — HARD ERROR
      "sfp/require-service-client": "error",
      // Prevents cascade failures in dashboard — warn until all widgets wrapped
      "sfp/require-widget-error-boundary": "warn",
    },
  },
]);

export default eslintConfig;
