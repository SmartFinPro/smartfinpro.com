/**
 * MDX type definitions — local copy to avoid importing from next-mdx-remote
 * in client components. Turbopack resolves next-mdx-remote/index.js (which
 * uses React hooks + window) even for type-only imports, causing a
 * "bail out to client-side rendering" error on server→client boundaries.
 *
 * These types mirror next-mdx-remote/dist/types.d.ts exactly.
 */

export type MDXRemoteSerializeResult<
  TScope = Record<string, unknown>,
  TFrontmatter = Record<string, unknown>,
> = {
  compiledSource: string;
  scope: TScope;
  frontmatter: TFrontmatter;
};
