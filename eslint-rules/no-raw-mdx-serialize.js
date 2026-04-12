/**
 * eslint-rules/no-raw-mdx-serialize.js
 *
 * Prevents direct import of serialize() from next-mdx-remote/serialize.
 * Must use serializeMDX() from @/lib/mdx/serialize instead.
 *
 * Severity: warn → error (after legacy cleanup)
 *
 * WHY: next-mdx-remote serialize() hard-codes development:true which emits
 * _missingMdxReference() checks. These crash in production when custom MDX
 * components are not yet registered. The custom wrapper in @/lib/mdx/serialize
 * strips these checks via regex post-processing.
 */

'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct import of serialize() from next-mdx-remote/serialize',
      recommended: true,
    },
    messages: {
      noRawSerialize:
        'Use serializeMDX() from @/lib/mdx/serialize instead of serialize() from next-mdx-remote/serialize. ' +
        'Direct use causes _missingMdxReference() crashes in production.',
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        // Skip the wrapper file itself — it must import serialize() to wrap it
        const filename = context.getFilename();
        if (filename.includes('lib/mdx/serialize')) return;
        if (source === 'next-mdx-remote/serialize') {
          // Check if 'serialize' is in the imported specifiers
          const hasSerialize = node.specifiers.some(
            (s) =>
              s.type === 'ImportSpecifier' &&
              s.imported.name === 'serialize'
          );
          if (hasSerialize) {
            context.report({ node, messageId: 'noRawSerialize' });
          }
        }
      },
    };
  },
};
