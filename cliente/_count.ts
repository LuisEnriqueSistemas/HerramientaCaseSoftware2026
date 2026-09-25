import fs from "node:fs";
const lines = fs.readFileSync("lib/uml-transformers.test.ts", "utf8").split("\n");
let d = 0;
let str = null;
let re = false;
let neg = -1;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i];
  let j = 0;
  while (j < t.length) {
    const c = t[j];
    if (re) {
      if (c === "\\") { j += 2; continue; }
      if (c === "/" && t[j - 1] !== "\\") re = false;
      j++;
      continue;
    }
    if (str) {
      if (c === "\\") { j += 2; continue; }
      if (c === str) str = null;
      j++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; j++; continue; }
    if (c === "/" && t[j + 1] === "/") break;
    if (c === "/" && t[j + 1] === "*") {
      while (j < t.length && !(t[j] === "*" && t[j + 1] === "/")) j++;
      j += 2;
      continue;
    }
    if (c === "{") d++;
    if (c === "}") d--;
    if (d < 0 && neg < 0) { neg = i + 1; console.log("NEGATIVO en linea", i + 1, t); }
    if (c === "/" && /[=(,:!&|?{};[\]]/.test(t[j - 1] || " ")) {
      re = true;
    }
    j++;
  }
}
console.log("FINAL d =", d, "negativo =", neg);
