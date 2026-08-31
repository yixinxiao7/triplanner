import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Guard test for audit finding H-06 (see
// openspec/changes/fix-audit-critical-high/design.md, decision D6, risk R4).
//
// jsdom does not run real layout — every element's getBoundingClientRect()
// returns zeros regardless of CSS, so a literal "click at the midpoint
// between two controls resolves to the right one" test is not meaningful
// here. Instead this test verifies the *geometry math* that guarantees
// non-overlap by construction: given the known, fixed CSS values (gap
// sizes, overlay dimensions), it proves the expanded targets cannot
// touch. Rendered-DOM class-application tests are covered by the
// existing FlightsEditPage/StaysEditPage/DestinationChipInput/
// ActivitiesEditPage/TripNotesSection test suites, which already assert
// on these buttons' presence and labels.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..');

function read(relPath) {
  return readFileSync(path.join(SRC, relPath), 'utf8');
}

function extractDeclarations(css, selector) {
  const re = new RegExp(`(?:^|\\})\\s*${selector.replace(/[.#]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm');
  const m = css.match(re);
  if (!m) throw new Error(`Selector "${selector}" not found`);
  return m[1];
}

function extractPx(declarationBlock, property) {
  const re = new RegExp(`${property}\\s*:\\s*(-?[\\d.]+)px`);
  const m = declarationBlock.match(re);
  if (!m) throw new Error(`Property "${property}" not found in: ${declarationBlock}`);
  return parseFloat(m[1]);
}

describe('target size geometry (audit H-06 guard)', () => {
  describe('.hit-target-44 shared utility', () => {
    const css = read('styles/global.css');
    const after = extractDeclarations(css, '.hit-target-44::after');

    it('overlay is exactly 44x44 CSS px', () => {
      expect(extractPx(after, 'width')).toBe(44);
      expect(extractPx(after, 'height')).toBe(44);
    });

    it('overlay is centered via absolute positioning + transform (does not affect layout)', () => {
      expect(after).toMatch(/position:\s*absolute/);
      expect(after).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
    });
  });

  describe('FlightsEditPage / StaysEditPage .cardActions icon pair', () => {
    // Known, fixed values: .iconBtn padding 4px + a 16px icon = 24px
    // rendered box. .hit-target-44 expands each to a 44px target
    // centered on that box. Two targets stop overlapping once their
    // centers are >= 44px apart. Center-to-center distance for two
    // adjacent flex children = (own box width) + gap = 24 + gap.
    // Solving 24 + gap >= 44 gives gap >= 20.
    const ICON_BOX = 24;
    const TARGET = 44;
    const requiredGap = TARGET - ICON_BOX;

    ['FlightsEditPage', 'StaysEditPage'].forEach((page) => {
      it(`${page}.module.css .cardActions gap is >= ${requiredGap}px (no overlap)`, () => {
        const css = read(`pages/${page}.module.css`);
        const decl = extractDeclarations(css, '.cardActions');
        const gap = extractPx(decl, 'gap');
        expect(gap).toBeGreaterThanOrEqual(requiredGap);
      });

      it(`${page}.module.css .iconBtn padding still renders a 4px/16px == 24px box (assumption holds)`, () => {
        const css = read(`pages/${page}.module.css`);
        const decl = extractDeclarations(css, '.iconBtn');
        expect(extractPx(decl, 'padding')).toBe(4);
      });
    });
  });

  describe('DestinationChipInput .chipRemove bespoke overlay', () => {
    // Known, fixed values: .container gap (between/within wrapped chip
    // rows) is 8px; .chip's internal gap (chipText <-> chipRemove) is
    // 6px. The overlay must expand by no more than half of either gap
    // on the corresponding side to guarantee it cannot touch a
    // neighbouring chip or this chip's own label.
    const css = read('components/DestinationChipInput.module.css');
    const containerGap = extractPx(extractDeclarations(css, '.container'), 'gap');
    const chipGap = extractPx(extractDeclarations(css, '.chip'), 'gap');
    const overlay = extractDeclarations(css, '.chipRemove::after');

    it('vertical (top/bottom) expansion does not exceed half the container row gap', () => {
      const top = Math.abs(extractPx(overlay, 'top'));
      const bottom = Math.abs(extractPx(overlay, 'bottom'));
      expect(top).toBeLessThanOrEqual(containerGap / 2);
      expect(bottom).toBeLessThanOrEqual(containerGap / 2);
    });

    it('inward (left, toward chipText) expansion does not exceed half the intra-chip gap', () => {
      const left = Math.abs(extractPx(overlay, 'left'));
      expect(left).toBeLessThanOrEqual(chipGap / 2);
    });

    it('outward (right) expansion does not exceed half the container gap', () => {
      const right = Math.abs(extractPx(overlay, 'right'));
      expect(right).toBeLessThanOrEqual(containerGap / 2);
    });

    it('.chipRemove has a positioning context for the overlay', () => {
      const decl = extractDeclarations(css, '.chipRemove');
      expect(decl).toMatch(/position:\s*relative/);
    });
  });
});
