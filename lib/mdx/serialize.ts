// lib/mdx/serialize.ts
// Custom MDX serializer wrapper around next-mdx-remote/serialize
//
// WHY: next-mdx-remote/serialize hard-codes `development: true` in dev mode,
// which causes the MDX compiler to emit _missingMdxReference() runtime checks.
// These checks throw "Expected component X to be defined" errors because our
// SafeMDX component injects components via Direct Pass (props.components) AFTER
// the compiled code's checks run.
//
// SOLUTION: We use next-mdx-remote/serialize normally (preserving JSX runtime
// compatibility), then strip the _missingMdxReference calls from the compiled
// output. This keeps the full plugin chain and runtime intact.

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';

/**
 * Compile MDX source to a serialized result compatible with SafeMDX.
 * Uses next-mdx-remote/serialize with post-processing to remove
 * _missingMdxReference checks that break our Direct Pass architecture.
 */
export async function serializeMDX(source: string): Promise<MDXRemoteSerializeResult> {
  const result = await serialize(source, {
    mdxOptions: { remarkPlugins: [remarkGfm] },
  });

  // Strip _missingMdxReference checks from the compiled output.
  // These are emitted in development mode and look like:
  //   if (!ProviderCard) _missingMdxReference("ProviderCard", true);
  //   if (!Warning) _missingMdxReference("Warning", true, "125:1-128:11");
  // We remove them because our SafeMDX injects components at render time.
  result.compiledSource = result.compiledSource.replace(
    /if\s*\(![\w]+\)\s*_missingMdxReference\([^)]*\);?\s*/g,
    ''
  );

  // Also remove the _missingMdxReference function definition itself if present
  result.compiledSource = result.compiledSource.replace(
    /function\s+_missingMdxReference\([^)]*\)\s*\{[^}]*\}/g,
    ''
  );

  return result;
}
