'use client';

/**
 * SafeMDX — Client-side MDX Rendering Component (Direct Pass)
 *
 * This Client Component receives pre-serialized MDX from the server
 * and renders it with all 50+ mdxComponents on the client side.
 *
 * ARCHITECTURE: Instead of relying on MDXProvider context from @mdx-js/react
 * (which breaks due to duplicate module instances between next-mdx-remote
 * and our app in Next.js 16 webpack/Turbopack), we implement a "Direct Pass"
 * approach that bypasses the context entirely:
 *
 * 1. Evaluate the compiled MDX source → get Content component (same as MDXRemote)
 * 2. Pass components directly as props: <Content components={mdxComponents} />
 * 3. The compiled MDX merges: { ...defaults, ..._provideComponents(), ...props.components }
 *    props.components wins LAST, so our components override the broken context.
 *
 * This is resilient against React context duplication — the #1 cause of
 * "Expected component X to be defined" errors in next-mdx-remote + Next.js 16.
 *
 * Server → serialize(source) → JSON payload → Client → Direct Pass renders
 */

import React, { useMemo } from 'react';
import * as mdxReact from '@mdx-js/react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { mdxComponents } from '@/lib/mdx/components';

// Pick the correct JSX runtime (dev vs prod)
const runtime = process.env.NODE_ENV === 'production' ? jsxRuntime : jsxDevRuntime;

interface SafeMDXProps {
  /** Pre-serialized MDX source from serialize() */
  source: MDXRemoteSerializeResult;
}

export default function SafeMDX({ source }: SafeMDXProps) {
  const { compiledSource, frontmatter, scope } = source;

  // Build the Content component from compiled MDX source
  // This is the same eval mechanism as next-mdx-remote/dist/index.js
  const Content = useMemo(() => {
    // 'opts' is what the compiled MDX accesses as arguments[0]
    // It needs: useMDXComponents (from @mdx-js/react), Fragment, jsx/jsxs/jsxDEV (from react runtime)
    const fullScope = Object.assign(
      { opts: { ...mdxReact, ...runtime } },
      { frontmatter },
      scope
    );
    const keys = Object.keys(fullScope);
    const values = Object.values(fullScope);

    // Evaluate: new Function('opts', 'frontmatter', '...compiledSource...')
    const hydrateFn = Reflect.construct(Function, keys.concat(`${compiledSource}`));
    return hydrateFn.apply(hydrateFn, values).default;
  }, [compiledSource, frontmatter, scope]);

  // DIRECT PASS — The key difference from MDXRemote:
  // MDXRemote wraps Content in <MDXProvider components={...}> and renders <Content /> with NO props.
  // The compiled MDX does: _components = { ...defaults, ..._provideComponents(), ...props.components }
  // When MDXProvider context is broken (duplicate modules), _provideComponents() returns {}.
  //
  // Our fix: Pass components directly as props.components — this is the LAST spread,
  // so our components always override, regardless of whether the context works.
  return (
    <div className="mdx-content-wrapper">
      <Content components={mdxComponents} />
    </div>
  );
}

export { SafeMDX };
