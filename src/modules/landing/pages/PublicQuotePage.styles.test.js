import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync('src/modules/landing/pages/PublicQuotePage.css', 'utf8');

describe('PublicQuotePage styles', () => {
  it('keeps the quote background across the root and long content', () => {
    expect(stylesheet).toMatch(/html:has\(\.public-quote-page\)[\s\S]*#root:has\(\.public-quote-page\)/);
    expect(stylesheet).toMatch(/\.public-quote-page\s*\{[\s\S]*min-height:\s*100vh/);
    expect(stylesheet).not.toMatch(/\.public-quote-page\s*\{[^}]*(?:^|;)\s*height:\s*100vh/m);
    expect(stylesheet).toMatch(/background-attachment:\s*fixed/);
  });

  it('preserves a readable hierarchy in the quote introduction', () => {
    expect(stylesheet).toMatch(/\.public-quote-intro\s*\{[\s\S]*padding:\s*1\.55rem 0 1\.05rem/);
    expect(stylesheet).toMatch(/\.public-quote-intro h1\s*\{[\s\S]*line-height:\s*1\.18/);
    expect(stylesheet).toMatch(/\.public-quote-intro > div > p:last-child\s*\{[\s\S]*max-width:\s*720px/);
  });
});
