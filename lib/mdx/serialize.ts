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
//
// v6 MIGRATION: next-mdx-remote@6 defaults blockJS=true and
// blockDangerousJS=true. Our MDX content uses JSX expressions
// (e.g. <Component prop={value} />) and is team-authored (trusted),
// so we set blockJS=false. blockDangerousJS remains true as an
// additional safety layer (no eval/Function needed in MDX source).

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';

/**
 * Compile MDX source to a serialized result compatible with SafeMDX.
 * Uses next-mdx-remote/serialize with post-processing to remove
 * _missingMdxReference checks that break our Direct Pass architecture.
 *
 * @param source  Raw MDX string (frontmatter already stripped by gray-matter)
 * @param scope   Extra variables injected into the MDX scope at render time.
 *                Use this to pass `frontmatter` data back in when the caller
 *                has already parsed it (e.g. category hub pages passing
 *                { frontmatter: pillarContent.meta } so MDX can reference
 *                frontmatter.faqs, frontmatter.sections, etc.)
 */
export async function serializeMDX(
  source: string,
  scope?: Record<string, unknown>,
): Promise<MDXRemoteSerializeResult> {
  // Strip HTML comments before compilation — MDX uses JSX syntax ({/* */}),
  // and <!-- --> causes "Unexpected character '!' (U+0021)" compilation errors.
  const cleanSource = source.replace(/<!--[\s\S]*?-->/g, '');

  const result = await serialize(cleanSource, {
    mdxOptions: { remarkPlugins: [remarkGfm] },
    // v6: Allow JSX expressions in MDX (team-authored content, not user input).
    // blockDangerousJS stays true (default) — no eval/Function in MDX source needed.
    blockJS: false,
    // Inject caller-provided scope (e.g. frontmatter data) into the compiled MDX.
    // SafeMDX spreads scope into the execution context, making these variables
    // available as MDX expressions like {frontmatter.faqs}.
    ...(scope ? { scope } : {}),
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
