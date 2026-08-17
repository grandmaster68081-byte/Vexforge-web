/**
 * VE-1-UI-IDENTITY-GUARD — verificación de iconografía visible en código.
 *
 * Revisa TypeScript/TSX y elimina comentarios antes de buscar sustitutos
 * Unicode genéricos. No modifica fuentes, datos, resultados ni contratos.
 */
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const SOURCE_ROOT = "src";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const TEMPLATE_QUOTE = String.fromCharCode(96);
const FORBIDDEN = /[\u{1F300}-\u{1FAFF}\u{2300}-\u{23FF}\u{2190}-\u{21FF}\u{2500}-\u{257F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu;

function sourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function withoutComments(source) {
  let result = "";
  let state = "code";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (state === "line") {
      if (char === "\\n") { result += char; state = "code"; }
      else result += " ";
      continue;
    }
    if (state === "block") {
      if (char === "*" && next === "/") { result += "  "; index += 1; state = "code"; }
      else result += char === "\\n" ? "\\n" : " ";
      continue;
    }
    if (state === "single" || state === "double" || state === "template") {
      result += char;
      if (char === "\\\\") { result += next ?? ""; index += 1; continue; }
      if ((state === "single" && char === "'") || (state === "double" && char === '"') || (state === "template" && char === TEMPLATE_QUOTE)) state = "code";
      continue;
    }
    if (char === "/" && next === "/") { result += "  "; index += 1; state = "line"; continue; }
    if (char === "/" && next === "*") { result += "  "; index += 1; state = "block"; continue; }
    if (char === "'") { result += char; state = "single"; continue; }
    if (char === '"') { result += char; state = "double"; continue; }
    if (char === TEMPLATE_QUOTE) { result += char; state = "template"; continue; }
    result += char;
  }
  return result;
}

const violations = [];
const files = sourceFiles(SOURCE_ROOT);
for (const file of files) {
  const clean = withoutComments(readFileSync(file, "utf8"));
  for (const match of clean.matchAll(FORBIDDEN)) {
    violations.push({
      file: relative(process.cwd(), file),
      line: clean.slice(0, match.index).split("\\n").length,
      symbol: match[0],
    });
  }
}

console.log(JSON.stringify({ files: files.length, violations: violations.length, examples: violations.slice(0, 30) }, null, 2));
if (violations.length > 0) {
  throw new Error("La interfaz contiene " + violations.length + " sustituto(s) Unicode genérico(s) fuera de comentarios.");
}
console.log("Identidad visual verificada: 0 sustitutos Unicode genéricos visibles.");
