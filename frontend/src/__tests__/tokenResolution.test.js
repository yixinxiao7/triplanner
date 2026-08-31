import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Guard test for audit finding H-05 (see
// openspec/changes/fix-audit-critical-high/design.md, decision D7).
//
// An unresolved CSS custom property does not degrade gracefully: it
// invalidates the whole declaration at computed-value time and silently
// resets the affected properties to their initial values (e.g. a
// `border` shorthand referencing an undefined token resets to
// `border-style: none`). That is exactly how H-05 happened —
// `--border-faint` was referenced once, defined nowhere, and the
// delete-confirmation button rendered with no visible border.
//
// This test scans every stylesheet in src/ for `var(--x)` references
// and fails if any referenced token is neither defined anywhere in the
// codebase nor given an explicit fallback at its point of use.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..');

function walk(dir, exts, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__') continue;
      walk(full, exts, results);
    } else if (exts.some((ext) => entry.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const cssFiles = walk(SRC_DIR, ['.css']);

// Collect every custom property defined anywhere in the codebase.
const definedTokens = new Set();
const defRe = /(--[\w-]+)\s*:/g;
for (const file of cssFiles) {
  const content = readFileSync(file, 'utf8');
  let m;
  while ((m = defRe.exec(content))) {
    definedTokens.add(m[1]);
  }
}

// Collect every var(--x) reference, noting whether it supplies a fallback,
// and the file/line it appears at for a useful failure message.
const refRe = /var\(\s*(--[\w-]+)\s*(,)?/g;
const references = [];
for (const file of cssFiles) {
  const content = readFileSync(file, 'utf8');
  const relPath = path.relative(SRC_DIR, file);
  let m;
  while ((m = refRe.exec(content))) {
    const upTo = content.slice(0, m.index);
    const line = upTo.split('\n').length;
    references.push({ token: m[1], hasFallback: Boolean(m[2]), file: relPath, line });
  }
}

describe('CSS custom property resolution (audit H-05 guard)', () => {
  it('found stylesheets to check', () => {
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  it('every var() reference is either defined or supplies a fallback', () => {
    const unresolved = references.filter(
      (r) => !definedTokens.has(r.token) && !r.hasFallback
    );
    if (unresolved.length > 0) {
      const detail = unresolved
        .map((r) => `  ${r.token}  at ${r.file}:${r.line}`)
        .join('\n');
      throw new Error(
        `Found ${unresolved.length} undefined CSS custom property reference(s) with no fallback:\n${detail}\n\n` +
          `An unresolved var() invalidates its whole declaration at computed-value time ` +
          `(the H-05 failure mode) — define the token or add a fallback.`
      );
    }
    expect(unresolved).toEqual([]);
  });
});
