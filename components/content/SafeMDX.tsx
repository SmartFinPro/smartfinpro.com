'use client';

/**
 * SafeMDX — Client-side MDX Rendering Component (Direct Pass)
 *
 * This Client Component receives pre-serialized MDX from the server
 * and renders it with all 50+ mdxComponents on the client side.
 *
 * ARCHITECTURE: "Direct Pass" approach that bypasses MDXProvider context
 * entirely, avoiding the duplicate module instances issue between
 * next-mdx-remote and our app in Next.js 16 Turbopack.
 *
 * IMPORTANT: We do NOT import @mdx-js/react or next-mdx-remote here.
 * Turbopack resolves transitive dependencies from those packages
 * (next-mdx-remote/index.js) even when they aren't directly used,
 * causing "module factory not available" errors. Instead we inline
 * the minimal useMDXComponents function that the compiled MDX expects.
 *
 * Server → serialize(source) → JSON payload → Client → Direct Pass renders
 */

import React, { useEffect, useState } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';
import { mdxComponents } from '@/lib/mdx/components';

// Pick the correct JSX runtime (dev vs prod)
const runtime = process.env.NODE_ENV === 'production' ? jsxRuntime : jsxDevRuntime;

// Inline useMDXComponents — replaces the import from @mdx-js/react.
// The compiled MDX calls opts.useMDXComponents() to get context components.
// We return an empty object since we pass components via Direct Pass (props.components).
function useMDXComponents(components?: Record<string, unknown>) {
  return components || {};
}

// This object mimics the @mdx-js/react export shape that compiled MDX expects in opts
const mdxReactShim = { useMDXComponents };

interface SafeMDXProps {
  /** Pre-serialized MDX source from serialize() */
  source: MDXRemoteSerializeResult;
}

export default function SafeMDX({ source }: SafeMDXProps) {
  const { compiledSource, frontmatter, scope } = source;
  const [Content, setContent] = useState<React.ComponentType<{ components?: typeof mdxComponents }> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveContent = async () => {
      // 'opts' is what the compiled MDX accesses as arguments[0]
      // It needs: useMDXComponents, Fragment, jsx/jsxs/jsxDEV
      const fullScope = Object.assign(
        { opts: { ...mdxReactShim, ...runtime } },
        { frontmatter },
        scope
      );
      const keys = Object.keys(fullScope);
      const values = Object.values(fullScope);

      // Evaluate: new Function('opts', 'frontmatter', '...compiledSource...')
      const hydrateFn = Reflect.construct(Function, keys.concat(`${compiledSource}`));
      const evaluated = hydrateFn.apply(hydrateFn, values) as unknown;
      const maybeModule = (evaluated && typeof (evaluated as PromiseLike<unknown>).then === 'function')
        ? await (evaluated as PromiseLike<unknown>)
        : evaluated;

      const nextContent =
        (maybeModule as { default?: unknown })?.default ?? maybeModule;

      if (!cancelled && typeof nextContent === 'function') {
        setContent(() => nextContent as React.ComponentType<{ components?: typeof mdxComponents }>);
      }
    };

    resolveContent().catch(() => {
      if (!cancelled) {
        setContent(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [compiledSource, frontmatter, scope]);

  if (!Content) {
    return null;
  }

  // DIRECT PASS — Pass components directly as props.components.
  // The compiled MDX merges: { ...defaults, ..._provideComponents(), ...props.components }
  // props.components wins LAST, so our components always override.
  return (
    <div className="mdx-content-wrapper">
      <Content components={mdxComponents} />
    </div>
  );
}

export { SafeMDX };
