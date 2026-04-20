// MCP stdio transport adapter for SmartFinPro.
//
// Boot sequence:
//   1. Load repo-root .env.local via dotenv (no separate .env in this folder)
//   2. Register 7 tools (6 read + 1 write)
//   3. Connect stdio transport
//
// Phase 2 can add an HTTP transport at src/transport-http.ts without
// touching tools/*.ts — the tools export pure handler functions.

import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Load .env.local from repo root (two levels up from scripts/mcp-server/src)
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
loadEnv({ path: resolve(REPO_ROOT, '.env.local') });

// ── Tool imports (after env is loaded) ─────────────────────────────────
import * as listAffiliateLinks from './tools/list-affiliate-links.js';
import * as getRevenueStats from './tools/get-revenue-stats.js';
import * as getConversionFunnel from './tools/get-conversion-funnel.js';
import * as getContentHealth from './tools/get-content-health.js';
import * as detectSchemaDrift from './tools/detect-schema-drift.js';
import * as getOrphanSlugs from './tools/get-orphan-slugs.js';
import * as activateAffiliateSlug from './tools/activate-affiliate-slug.js';

interface ToolModule {
  TOOL_NAME: string;
  TOOL_DESCRIPTION: string;
  TOOL_INPUT_SCHEMA: z.ZodSchema;
  handle: (args: unknown) => Promise<unknown>;
}

const TOOLS: ToolModule[] = [
  listAffiliateLinks,
  getRevenueStats,
  getConversionFunnel,
  getContentHealth,
  detectSchemaDrift,
  getOrphanSlugs,
  activateAffiliateSlug,
];

// ── Build MCP server ────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'smartfinpro',
    version: '0.1.0',
  },
  {
    capabilities: { tools: {} },
  },
);

// List-tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS.map((t) => ({
      name: t.TOOL_NAME,
      description: t.TOOL_DESCRIPTION,
      inputSchema: zodToJsonSchema(t.TOOL_INPUT_SCHEMA),
    })),
  };
});

// Call-tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = TOOLS.find((t) => t.TOOL_NAME === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  const args = request.params.arguments ?? {};
  try {
    const result = await tool.handle(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: msg }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ── Zod → JSON Schema (minimal converter for MCP) ──────────────────────
//
// MCP expects a JSON Schema object in inputSchema. We convert Zod schemas
// via a minimal shim — we only need the shapes we actually use (objects
// with primitives, enums, optional fields, defaults).

interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: readonly unknown[];
  additionalProperties?: boolean;
  description?: string;
}

function zodToJsonSchema(schema: z.ZodSchema): JsonSchema {
  const def = (schema as unknown as { _def: { typeName: string } })._def;
  const typeName = def?.typeName;

  if (typeName === 'ZodObject') {
    const shape = (schema as z.ZodObject<Record<string, z.ZodSchema>>).shape;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, fieldSchema] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(fieldSchema);
      if (!isOptional(fieldSchema)) required.push(key);
    }
    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
      additionalProperties: false,
    };
  }

  if (typeName === 'ZodOptional' || typeName === 'ZodDefault') {
    const inner = (schema as unknown as { _def: { innerType: z.ZodSchema } })._def.innerType;
    return zodToJsonSchema(inner);
  }

  if (typeName === 'ZodEnum') {
    const values = (schema as unknown as { _def: { values: string[] } })._def.values;
    return { type: 'string', enum: values };
  }

  if (typeName === 'ZodString') return { type: 'string' };
  if (typeName === 'ZodNumber') return { type: 'number' };
  if (typeName === 'ZodBoolean') return { type: 'boolean' };
  if (typeName === 'ZodArray') return { type: 'array' };

  // Fallback
  return { type: 'object' };
}

function isOptional(schema: z.ZodSchema): boolean {
  const def = (schema as unknown as { _def: { typeName: string } })._def;
  return def?.typeName === 'ZodOptional' || def?.typeName === 'ZodDefault';
}

// ── Connect + run ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is reserved for MCP protocol messages
  console.error('[smartfinpro-mcp] connected via stdio, 7 tools registered');
}

main().catch((err) => {
  console.error('[smartfinpro-mcp] fatal:', err);
  process.exit(1);
});
