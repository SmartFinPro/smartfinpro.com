'use client';

/**
 * SafeMDX — Client-side MDX Rendering Component
 *
 * This Client Component receives pre-serialized MDX from the server
 * and renders it with all 50+ mdxComponents on the client side.
 *
 * By using the client-side MDXRemote (not /rsc), we completely avoid
 * Turbopack's RSC chunk serialization of complex component trees,
 * which causes the "chunk.reason.enqueueModel is not a function" error.
 *
 * Server → serialize(source) → JSON payload → Client → MDXRemote renders
 */

import { MDXRemote } from 'next-mdx-remote';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { mdxComponents } from '@/lib/mdx/components';

interface SafeMDXProps {
  /** Pre-serialized MDX source from serialize() */
  source: MDXRemoteSerializeResult;
}

export default function SafeMDX({ source }: SafeMDXProps) {
  return (
    <div className="mdx-content-wrapper">
      <MDXRemote {...source} components={mdxComponents} />
    </div>
  );
}

export { SafeMDX };
