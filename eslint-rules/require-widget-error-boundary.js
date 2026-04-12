/**
 * eslint-rules/require-widget-error-boundary.js
 *
 * In components/dashboard/**:
 * Flags exported React components that return JSX without being wrapped
 * in WidgetErrorBoundary somewhere in their render tree.
 *
 * Severity: warn → error (after legacy cleanup)
 *
 * WHY: Dashboard is a server-rendered page. If a single widget throws
 * during client-side render, the entire dashboard page becomes unusable.
 * WidgetErrorBoundary catches widget-level errors gracefully and shows
 * a "Widget unavailable" fallback without breaking the rest of the UI.
 *
 * NOTE: This rule only checks direct JSX returns. Widgets that compose
 * WidgetErrorBoundary internally (re-exported wrappers) won't be flagged.
 */

'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require WidgetErrorBoundary wrapper in dashboard widget components',
      recommended: true,
    },
    messages: {
      missingErrorBoundary:
        'Dashboard widget "{{name}}" should be wrapped in <WidgetErrorBoundary label="{{name}}" minHeight="h-48">. ' +
        'This prevents a single widget error from breaking the entire dashboard.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only applies in dashboard components
    if (!filename.includes('/components/dashboard/')) return {};

    // Skip the error boundary component itself and the index/barrel files
    if (
      filename.includes('widget-error-boundary') ||
      filename.endsWith('/index.ts') ||
      filename.endsWith('/index.tsx')
    ) {
      return {};
    }

    /**
     * Walk the component body collecting returned JSX nodes.
     * Stops at nested function boundaries (arrow fns, callbacks) so that
     * `items.map(item => { return <li/> })` doesn't overwrite the outer return.
     */
    function collectTopLevelJsxReturns(n, results) {
      if (!n || typeof n !== 'object') return;
      // Don't descend into nested function bodies — they are not this component's returns
      if (
        n.type === 'ArrowFunctionExpression' ||
        n.type === 'FunctionExpression' ||
        n.type === 'FunctionDeclaration'
      ) return;
      if (
        n.type === 'ReturnStatement' &&
        n.argument &&
        (n.argument.type === 'JSXElement' || n.argument.type === 'JSXFragment')
      ) {
        results.push(n.argument);
      }
      for (const key of Object.keys(n)) {
        if (key === 'parent') continue;
        const child = n[key];
        if (Array.isArray(child)) child.forEach(c => collectTopLevelJsxReturns(c, results));
        else if (child && typeof child === 'object' && child.type) collectTopLevelJsxReturns(child, results);
      }
    }

    /**
     * Check if a JSX element or its descendants includes WidgetErrorBoundary.
     */
    function hasErrorBoundary(node) {
      if (!node) return false;
      if (
        node.type === 'JSXElement' &&
        node.openingElement.name.name === 'WidgetErrorBoundary'
      ) {
        return true;
      }
      // Check children
      if (node.children) {
        return node.children.some(hasErrorBoundary);
      }
      return false;
    }

    return {
      ExportNamedDeclaration(node) {
        // Only check function declarations and arrow functions assigned to const
        const decl = node.declaration;
        if (!decl) return;

        let funcNode = null;
        let funcName = null;

        if (decl.type === 'FunctionDeclaration') {
          funcNode = decl;
          funcName = decl.id ? decl.id.name : null;
        } else if (decl.type === 'VariableDeclaration') {
          for (const declarator of decl.declarations) {
            if (
              declarator.init &&
              (declarator.init.type === 'ArrowFunctionExpression' ||
                declarator.init.type === 'FunctionExpression')
            ) {
              funcNode = declarator.init;
              funcName = declarator.id ? declarator.id.name : null;
            }
          }
        }

        if (!funcNode || !funcName) return;

        // Heuristic: if name ends with Widget, Chart, Feed, Table, Card
        const isDashboardWidget = /Widget|Chart|Feed|Table|Card|Overview|Bar$/.test(funcName);
        if (!isDashboardWidget) return;

        // Find returned JSX — only top-level returns, not inside nested callbacks
        const body = funcNode.body;
        if (!body) return;

        let jsxReturns = [];
        // For arrow functions with expression body (implicit return)
        if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
          jsxReturns = [body];
        } else {
          collectTopLevelJsxReturns(body, jsxReturns);
        }

        if (jsxReturns.length === 0) return;
        // All top-level JSX returns must be wrapped (handles early-return patterns)
        if (jsxReturns.every(hasErrorBoundary)) return;

        context.report({
          node,
          messageId: 'missingErrorBoundary',
          data: { name: funcName },
        });
      },
    };
  },
};
