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

  // ── SmartFinPro Custom Rules (Phase 1: warn — Phase 2: error after cleanup) ──
  {
    plugins: { sfp: sfpRulesPlugin },
    rules: {
      // Prevents _missingMdxReference crash in production
      "sfp/no-raw-mdx-serialize": "warn",
      // Prevents silent auth failures in server-only contexts
      "sfp/require-service-client": "warn",
      // Prevents cascade failures in dashboard
      "sfp/require-widget-error-boundary": "warn",
    },
  },
]);

export default eslintConfig;
