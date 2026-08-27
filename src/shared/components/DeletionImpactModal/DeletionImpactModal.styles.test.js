import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  resolve('src/shared/components/DeletionImpactModal/DeletionImpactModal.css'),
  'utf8',
);

describe('DeletionImpactModal responsive layout', () => {
  it('keeps content inside the viewport and stacks actions on mobile', () => {
    expect(css).toContain('max-height: min(90vh, 720px)');
    expect(css).toContain('overflow-y: auto');
    expect(css).toMatch(/@media \(max-width: 560px\)/);
    expect(css).toContain('flex-direction: column-reverse');
    expect(css).not.toContain('overflow-x: auto');
  });
});
