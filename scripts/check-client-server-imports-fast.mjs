#!/usr/bin/env node
/**
 * scripts/check-client-server-imports-fast.mjs
 *
 * Fast single-file check for the PostToolUse hook.
 * Checks a single .ts/.tsx file for critical anti-patterns:
 *   1. 'use client' file importing from lib/actions directly
 *   2. 'use client' file using serialize() from next-mdx-remote directly
 *   3. createClient() in lib/actions or app/api/cron (should be createServiceClient)
 *
 * Usage: node scripts/check-client-server-imports-fast.mjs <file>
 * Exit 0 = clean, prints nothing
 * Exit 0 = issues found (non-blocking), prints warnings to stderr
 */

import fs from 'fs';
import path from 'path';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) process.exit(0);

const content = fs.readFileSync(file, 'utf-8');
const rel = path.relative(process.cwd(), file);
const warnings = [];

// Check 1: 'use client' + direct lib/actions import
if (
  (content.includes("'use client'") || content.includes('"use client"')) &&
  (content.includes("from '@/lib/actions") || content.includes('from "@/lib/actions') ||
   content.includes("import('@/lib/actions") || content.includes('import("@/lib/actions'))
) {
  // Only flag in MDX and marketing components (not dashboard)
  if (rel.match(/lib\/mdx|components\/marketing|components\/content/)) {
    warnings.push(
      `⚠️  [hook] ${rel}\n` +
      `   'use client' imports from lib/actions — use fetch('/api/...') instead\n` +
      `   (Turbopack crash risk — see CLAUDE.md Häufige Fallstricke)`
    );
  }
}

// Check 2: serialize() from next-mdx-remote directly
if (
  content.includes("from 'next-mdx-remote/serialize'") ||
  content.includes('from "next-mdx-remote/serialize"')
) {
  warnings.push(
    `⚠️  [hook] ${rel}\n` +
    `   Direct import of serialize() from next-mdx-remote — use serializeMDX() from @/lib/mdx/serialize\n` +
    `   (Will cause _missingMdxReference crash in production)`
  );
}

// Check 3: createClient() in server-only contexts where createServiceClient() is needed
if (
  rel.match(/lib\/actions|app\/api\/cron/) &&
  content.includes('createClient()') &&
  !content.includes('createServiceClient()')
) {
  warnings.push(
    `⚠️  [hook] ${rel}\n` +
    `   Uses createClient() in server-only context — use createServiceClient() instead\n` +
    `   (createClient() requires browser cookie context, crashes in cron/server actions)`
  );
}

if (warnings.length) {
  for (const w of warnings) process.stderr.write(w + '\n');
}

process.exit(0); // Non-blocking — always exit 0 from hook
