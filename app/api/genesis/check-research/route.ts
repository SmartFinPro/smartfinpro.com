import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') || '';
  const category = searchParams.get('category') || '';
  const slug = searchParams.get('slug') || '';

  if (!market || !category || !slug) {
    return NextResponse.json({ found: false });
  }

  const researchDir = path.join(process.cwd(), 'content', 'research', market, category);

  for (const ext of ['.md', '.txt']) {
    const candidate = path.join(researchDir, `${slug}${ext}`);
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate, 'utf-8');
      const filename = `content/research/${market}/${category}/${slug}${ext}`;
      return NextResponse.json({ found: true, filename, content });
    }
  }

  return NextResponse.json({ found: false });
}
