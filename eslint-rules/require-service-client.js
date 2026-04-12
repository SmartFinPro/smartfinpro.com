/**
 * eslint-rules/require-service-client.js
 *
 * In lib/actions/*.ts and app/api/cron/**:
 * Flags createClient() calls — should be createServiceClient() for server-only contexts.
 *
 * Severity: warn → error (after legacy cleanup)
 *
 * WHY: createClient() uses browser cookie context (SSR mode).
 * In server actions and cron routes there is no HTTP request / cookie jar,
 * so createClient() silently returns an unauthenticated client, causing
 * all DB operations to fail (RLS blocks them). createServiceClient() uses
 * the SUPABASE_SERVICE_ROLE_KEY directly and bypasses RLS safely on the server.
 */

'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require createServiceClient() instead of createClient() in server-only contexts',
      recommended: true,
    },
    messages: {
      useServiceClient:
        'Use createServiceClient() from @/lib/supabase/server in server actions and cron routes. ' +
        'createClient() requires a browser cookie context and silently fails in server-only contexts.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only applies in server-only contexts
    const isServerOnlyContext =
      filename.includes('/lib/actions/') ||
      filename.includes('/app/api/cron/');

    if (!isServerOnlyContext) return {};

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'createClient' &&
          node.arguments.length === 0
        ) {
          context.report({ node, messageId: 'useServiceClient' });
        }
      },
    };
  },
};
