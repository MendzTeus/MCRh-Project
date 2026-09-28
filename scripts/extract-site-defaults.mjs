// Builds src/content/siteDefaults.generated.json: the text the public site shows
// for every editable SiteContent key when the admin hasn't set a value.
//
// Those defaults live inline in the public pages as the fallback argument of
// `text(site.content, key, fallback)` / `list(site.content, key, fallback)`.
// Reading them from the source (instead of copying them into a second file)
// means the public pages stay untouched and the admin can never drift from
// what the site really shows. A test re-runs the extraction and fails if the
// generated file is stale.
//
// Usage: npm run content:defaults
import ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'src/content/siteDefaults.generated.json');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

// Admin screens read content too, but only public pages define what visitors see.
const isPublicSource = (file) => !/[\\/]pages[\\/]Admin|[\\/]components[\\/]admin[\\/]/.test(file);

// Turns a literal expression into plain JSON. Identifiers are resolved to a
// `const` declared in the same file (e.g. DEFAULT_NAV_LINKS).
function evaluate(node, consts) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((el) => evaluate(el, consts));
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) throw new Error('unsupported object member');
      const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : null;
      if (key == null) throw new Error('unsupported object key');
      out[key] = evaluate(prop.initializer, consts);
    }
    return out;
  }
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression?.(node)) {
    return evaluate(node.expression, consts);
  }
  if (ts.isIdentifier(node) && consts.has(node.text)) return evaluate(consts.get(node.text), consts);
  throw new Error(`not a literal: ${node.getText()}`);
}

export function extractSiteDefaults() {
  const defaults = {};
  const conflicts = [];
  const skipped = [];

  for (const file of walk(join(ROOT, 'src')).filter(isPublicSource)) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const consts = new Map();
    const collectConsts = (node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        consts.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, collectConsts);
    };
    collectConsts(source);

    const visit = (node) => {
      if (
        ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && (node.expression.text === 'text' || node.expression.text === 'list')
        && node.arguments.length === 3
        && /content$/.test(node.arguments[0].getText())
      ) {
        const [, keyNode, fallbackNode] = node.arguments;
        const where = `${relative(ROOT, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
        if (!ts.isStringLiteral(keyNode)) {
          skipped.push(`${where} dynamic key ${keyNode.getText()}`);
        } else {
          try {
            const value = evaluate(fallbackNode, consts);
            const key = keyNode.text;
            if (key in defaults && JSON.stringify(defaults[key].value) !== JSON.stringify(value)) {
              conflicts.push(`${key}: ${defaults[key].where} vs ${where}`);
            } else if (!(key in defaults)) {
              defaults[key] = { value, where };
            }
          } catch (err) {
            skipped.push(`${where} ${err.message}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  const sorted = Object.fromEntries(Object.keys(defaults).sort().map((k) => [k, defaults[k].value]));
  return { defaults: sorted, conflicts, skipped };
}

export function serialize(defaults) {
  return `${JSON.stringify(defaults, null, 2)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { defaults, conflicts, skipped } = extractSiteDefaults();
  writeFileSync(OUT, serialize(defaults));
  console.log(`Wrote ${Object.keys(defaults).length} defaults to ${relative(ROOT, OUT)}`);
  if (conflicts.length) console.warn('Same key with different fallbacks (first one kept):\n  ' + conflicts.join('\n  '));
  if (skipped.length) console.warn('Skipped:\n  ' + skipped.join('\n  '));
}
