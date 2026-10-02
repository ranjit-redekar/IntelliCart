// Run: cd web && npx tsx src/admin/lib/csv.check.ts
import { csvCell, parseCsv, toCsv } from "./csv";

// No node:assert — this file is type-checked with the browser app config.
const assert = {
  equal(actual: string, expected: string) {
    if (actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },
};

assert.equal(csvCell("plain"), "plain");
assert.equal(csvCell(null), "");
assert.equal(csvCell(12.5), "12.5");
assert.equal(csvCell("a,b"), '"a,b"');
assert.equal(csvCell('say "hi"'), '"say ""hi"""');
assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
assert.equal(csvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
assert.equal(csvCell("+1"), "'+1");
assert.equal(csvCell("-5"), "'-5");
assert.equal(csvCell(-5), "-5");
assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
assert.equal(csvCell(["a", "b"]), "a; b");
assert.equal(
  toCsv([{ id: "P-1", name: "Mug, large" }], [{ key: "id", label: "ID" }, { key: "name", label: "Name" }]),
  'ID,Name\r\nP-1,"Mug, large"\r\n',
);

// Round trip: toCsv -> parseCsv gives back the cells (formula guard removed).
const cols = [{ key: "a", label: "A" }, { key: "b", label: "B, quoted \"label\"" }];
const data = [
  { a: "plain", b: "Mug, large" },
  { a: 'say "hi"', b: "line1\nline2\r\nline3" },
  { a: "=HYPERLINK(\"x\")", b: "-5" },
  { a: "+1", b: "@SUM(A1)" },
  { a: "", b: "trailing," },
];
const parsed = parseCsv(toCsv(data, cols));
assert.equal(JSON.stringify(parsed), JSON.stringify([cols.map((c) => c.label), ...data.map((r) => [r.a, r.b])]));
assert.equal(JSON.stringify(parseCsv("\uFEFFx,y\na,b")), JSON.stringify([["x", "y"], ["a", "b"]]));
assert.equal(JSON.stringify(parseCsv("x\r\n\r\ny\r\n")), JSON.stringify([["x"], [""], ["y"]]));
assert.equal(JSON.stringify(parseCsv("'it's,'=x")), JSON.stringify([["'it's", "=x"]]));
assert.equal(JSON.stringify(parseCsv("")), "[]");
console.log("csv check: ok");
