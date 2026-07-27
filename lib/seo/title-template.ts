// lib/seo/title-template.ts
// Single source of truth for the root <title> template suffix that
// app/layout.tsx applies to every page title via Next.js metadata
// (`metadata.title.template`). Anything that needs to reason about a
// *rendered* title length — most importantly
// __tests__/unit/research-hub-copy.test.ts, which asserts the Research hub
// titles stay inside the 45-60 char SERP window — must derive the suffix
// from here instead of re-typing the literal ' | SmartFinPro' string.
// Otherwise the brand token could grow in app/layout.tsx without the test
// ever seeing it, and the 60-char ceiling would stop being enforced for the
// exact thing it exists to protect.

export const TITLE_TEMPLATE_SUFFIX = ' | SmartFinPro';

/** Renders `title` the same way Next.js resolves `metadata.title.template`
 *  (`'%s' + TITLE_TEMPLATE_SUFFIX`), so callers computing an expected
 *  rendered title share one source of truth with app/layout.tsx. */
export const renderTitle = (title: string): string =>
  `${title}${TITLE_TEMPLATE_SUFFIX}`;
