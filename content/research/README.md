# Genesis Hub — Research Brief Folder

Place your Perplexity (or other tool) research files here before generating content via the Genesis Hub.

## Folder Structure

```
content/research/
├── us/
│   ├── trading/
│   ├── ai-tools/
│   ├── personal-finance/
│   ├── cybersecurity/
│   └── ...
├── uk/
├── ca/
└── au/
```

## File Naming Convention

Files must match the keyword slug pattern (same as the keyword you enter in Genesis Hub):

```
[keyword in lowercase, spaces → hyphens, max 60 chars].md
```

**Examples:**
- Keyword: `best crypto wallets uk` → `best-crypto-wallets-uk.md`
- Keyword: `top robo advisors 2026` → `top-robo-advisors-2026.md`
- Keyword: `best forex brokers australia` → `best-forex-brokers-australia.md`

## Workflow

1. Research your topic in Perplexity or Claude
2. Copy the full research output (facts, data, comparisons, pricing, etc.)
3. Save it as `content/research/[market]/[category]/[keyword-slug].md`
4. Go to Genesis Hub → enter the same keyword → click a suggestion card
5. Genesis Hub will auto-detect the file (green "File detected" badge) and pre-fill the research textarea
6. Click **Generate** — Claude will use your research to write factual, data-rich content

## Tips

- Include real pricing data, product names, features, and any specific numbers
- The more specific and factual the research, the better the MDX output
- You can also paste research directly in the textarea in Genesis Hub (no file needed)
- Files up to ~15,000 words are supported
