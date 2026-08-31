import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Guard test for audit findings H-01, H-02, H-03, H-04, H-07 (see
// openspec/changes/fix-audit-critical-high/design.md, decision D3/D7).
//
// Parses the :root custom-property values straight out of global.css,
// composites any alpha channel against the real backdrop it renders on,
// and asserts the resulting contrast ratio meets its WCAG threshold.
// This is what would have caught the original nine contrast failures,
// and it keeps the design D3 table executable rather than documentary.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.join(__dirname, '..', 'styles', 'global.css');

function parseRootTokens(css) {
  const rootMatch = css.match(/:root\s*{([\s\S]*?)\n}/);
  if (!rootMatch) throw new Error('Could not locate :root block in global.css');
  const body = rootMatch[1];
  const tokens = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body))) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

function resolveVarRefs(value, tokens, depth = 0) {
  if (depth > 5) throw new Error(`var() reference too deep resolving "${value}"`);
  const varMatch = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (!varMatch) return value;
  const [, refName, fallback] = varMatch;
  if (tokens[refName] !== undefined) {
    return resolveVarRefs(tokens[refName], tokens, depth + 1);
  }
  if (fallback !== undefined) return fallback.trim();
  throw new Error(`Unresolved token reference: ${refName}`);
}

function parseColor(value) {
  const hex = value.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const n = hex[1];
    return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16), a: 1 };
  }
  const rgba = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgba) {
    return {
      r: parseFloat(rgba[1]),
      g: parseFloat(rgba[2]),
      b: parseFloat(rgba[3]),
      a: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1,
    };
  }
  throw new Error(`Unrecognized color format: "${value}"`);
}

function compositeOver(fg, bg) {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
  };
}

function relativeLuminance({ r, g, b }) {
  const lin = (c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(colorA, colorB) {
  const lA = relativeLuminance(colorA);
  const lB = relativeLuminance(colorB);
  const [lighter, darker] = lA >= lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Resolve a token to its final composited RGB against a given backdrop. */
function resolvedRatio(tokens, tokenName, backdropTokenName) {
  const raw = resolveVarRefs(tokens[tokenName], tokens);
  const fg = parseColor(raw);
  const backdropRaw = resolveVarRefs(tokens[backdropTokenName], tokens);
  const bg = parseColor(backdropRaw);
  const composited = compositeOver(fg, bg);
  return contrastRatio(composited, bg);
}

const css = readFileSync(CSS_PATH, 'utf8');
const tokens = parseRootTokens(css);

const SURFACES = {
  'bg-primary': '--bg-primary',
  surface: '--surface',
  'surface-alt': '--surface-alt',
};

describe('design token contrast (WCAG, audit H-01/H-02/H-03/H-04/H-07)', () => {
  it('parses the expected tokens out of global.css', () => {
    expect(tokens['--bg-primary']).toBeDefined();
    expect(tokens['--accent-text']).toBeDefined();
    expect(tokens['--focus-ring']).toBeDefined();
  });

  // Text-role tokens: 4.5:1 AA minimum against every surface they render on.
  const textCases = [
    ['--text-primary', ['bg-primary']],
    ['--text-secondary', ['bg-primary']],
    ['--text-faint', ['bg-primary']],
    ['--accent-text', ['bg-primary', 'surface', 'surface-alt']],
    ['--color-danger', ['bg-primary']],
    ['--color-warning', ['bg-primary']],
    ['--status-planning-text', ['bg-primary']],
    ['--event-land-travel-text', ['bg-primary']],
    ['--color-success', ['bg-primary']],
  ];

  textCases.forEach(([tokenName, surfaces]) => {
    surfaces.forEach((surfaceName) => {
      it(`${tokenName} clears 4.5:1 on --${surfaceName}`, () => {
        const ratio = resolvedRatio(tokens, tokenName, SURFACES[surfaceName]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  // --text-muted: design D3/task 2.3 — passes on bg-primary and surface;
  // surface-alt sits at 3.86:1, which is audit finding M-06 and explicitly
  // out of scope for this change. Encoded here as a known, tracked gap
  // rather than silently passing or being omitted.
  it('--text-muted clears 4.5:1 on --bg-primary', () => {
    expect(resolvedRatio(tokens, '--text-muted', '--bg-primary')).toBeGreaterThanOrEqual(4.5);
  });
  it('--text-muted clears 4.5:1 on --surface', () => {
    expect(resolvedRatio(tokens, '--text-muted', '--surface')).toBeGreaterThanOrEqual(4.5);
  });
  it.skip('--text-muted on --surface-alt (KNOWN GAP: audit M-06, out of scope for fix-audit-critical-high)', () => {
    // Currently ~3.86:1. Fixing this is tracked separately as M-06.
    expect(resolvedRatio(tokens, '--text-muted', '--surface-alt')).toBeGreaterThanOrEqual(4.5);
  });

  // --focus-ring: non-text UI component, 3:1 AA minimum, against all three surfaces (H-01).
  ['bg-primary', 'surface', 'surface-alt'].forEach((surfaceName) => {
    it(`--focus-ring clears 3:1 on --${surfaceName}`, () => {
      const ratio = resolvedRatio(tokens, '--focus-ring', SURFACES[surfaceName]);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });

  // --accent itself is boundary/background-role only and must keep clearing
  // 3:1 against the page background where it is used as a border (D1).
  it('--accent (boundary role) still clears 3:1 on --bg-primary', () => {
    const ratio = resolvedRatio(tokens, '--accent', '--bg-primary');
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});
