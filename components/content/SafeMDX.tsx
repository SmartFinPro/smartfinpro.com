'use client';

/**
 * SafeMDX — MDX Rendering Component (Direct Pass)
 *
 * Receives pre-serialized MDX from the server and renders it with all 50+
 * mdxComponents.
 *
 * ARCHITECTURE: "Direct Pass" — bypasses MDXProvider context entirely to avoid
 * the duplicate-module-instance issue between next-mdx-remote and our app under
 * Next.js 16 Turbopack. We do NOT import @mdx-js/react or next-mdx-remote here;
 * we inline the minimal useMDXComponents the compiled MDX expects.
 *
 * SSR: the compiled MDX is evaluated SYNCHRONOUSLY in useMemo, so it renders on
 * the server too — the article body (headings, tables, prose) is in the server
 * HTML and therefore crawlable by non-JS AI bots (GPTBot/ClaudeBot/Perplexity)
 * and indexable without a JS pass. `new Function(compiledSource)` runs fine in
 * the Node server runtime; the eval only touches react/jsx-runtime + our inlined
 * shim (no external module resolution → no Turbopack "module factory" error).
 *
 * Async fallback: if a page's compiled MDX ever evaluates to a Promise, the sync
 * pass yields null and a client-side effect resolves it (the pre-SSR behaviour) —
 * so no page can regress; it just renders client-only like before.
 *
 * Server → serializeMDX(source) → JSON payload → SafeMDX renders (SSR + client)
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
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

type MDXContentComponent = React.ComponentType<{ components?: typeof mdxComponents }>;

/**
 * Evaluate the compiled MDX into its default export (the MDXContent component).
 * Returns the raw evaluated value — which is normally the module synchronously,
 * but may be a Promise for async-compiled MDX.
 */
function evaluateCompiledMDX(
  compiledSource: string,
  frontmatter: unknown,
  scope: Record<string, unknown> | undefined,
): unknown {
  // 'opts' is what the compiled MDX accesses as arguments[0].
  // It needs: useMDXComponents, Fragment, jsx/jsxs/jsxDEV.
  const fullScope = Object.assign(
    { opts: { ...mdxReactShim, ...runtime } },
    { frontmatter },
    scope,
  );
  const keys = Object.keys(fullScope);
  const values = Object.values(fullScope);
  const hydrateFn = Reflect.construct(Function, keys.concat(`${compiledSource}`));
  return hydrateFn.apply(hydrateFn, values);
}

function pickContent(evaluated: unknown): MDXContentComponent | null {
  const maybeModule = (evaluated as { default?: unknown })?.default ?? evaluated;
  return typeof maybeModule === 'function' ? (maybeModule as MDXContentComponent) : null;
}

interface SafeMDXProps {
  /** Pre-serialized MDX source from serializeMDX() */
  source: MDXRemoteSerializeResult;
}

// Error boundary around the rendered MDX body. A single bad/undefined component
// in one MDX file used to be harmless (client-only render); now that the body is
// server-rendered, an uncaught throw would 500 the entire page. This contains it:
// the page shell + frontmatter-driven content still render; only the MDX body
// degrades to nothing. Fix the offending component/MDX to restore the body.
class MDXContentBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export default function SafeMDX({ source }: SafeMDXProps) {
  const { compiledSource, frontmatter, scope } = source;

  // SYNCHRONOUS path — runs during SSR and on the client. For the standard
  // (synchronous) compiled MDX this produces the content on the server, so the
  // full article body lands in the SSR HTML.
  const syncContent = useMemo<MDXContentComponent | null>(() => {
    try {
      const evaluated = evaluateCompiledMDX(compiledSource, frontmatter, scope);
      // Async-compiled MDX → defer to the client fallback below.
      if (evaluated && typeof (evaluated as PromiseLike<unknown>).then === 'function') {
        return null;
      }
      return pickContent(evaluated);
    } catch {
      return null;
    }
  }, [compiledSource, frontmatter, scope]);

  // CLIENT fallback — only does work when the sync path produced nothing
  // (i.e. async-compiled MDX). Preserves the pre-SSR client-only behaviour so
  // no page can regress.
  const [asyncContent, setAsyncContent] = useState<MDXContentComponent | null>(null);
  useEffect(() => {
    if (syncContent) return;
    let cancelled = false;
    (async () => {
      try {
        const evaluated = evaluateCompiledMDX(compiledSource, frontmatter, scope);
        const resolved =
          evaluated && typeof (evaluated as PromiseLike<unknown>).then === 'function'
            ? await (evaluated as PromiseLike<unknown>)
            : evaluated;
        const next = pickContent(resolved);
        if (!cancelled && next) setAsyncContent(() => next);
      } catch {
        if (!cancelled) setAsyncContent(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncContent, compiledSource, frontmatter, scope]);

  const Content = syncContent ?? asyncContent;
  if (!Content) {
    return null;
  }

  // DIRECT PASS — components passed as props.components win last in the compiled
  // MDX merge, so our components always override.
  // Suspense makes a throw inside the MDX body a *recoverable* SSR error (the
  // boundary's fallback is streamed) instead of a fatal shell error that 500s the
  // page. The error boundary then renders nothing for the broken subtree, so the
  // page returns 200 with the shell intact. Fix the offending MDX to restore the body.
  return (
    <div className="mdx-content-wrapper">
      <Suspense fallback={null}>
        <MDXContentBoundary>
          <Content components={mdxComponents} />
        </MDXContentBoundary>
      </Suspense>
    </div>
  );
}

export { SafeMDX };
