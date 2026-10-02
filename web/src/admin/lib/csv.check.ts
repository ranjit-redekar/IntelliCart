// Run: cd web && npx tsx src/admin/lib/csv.check.ts
import { csvCell, toCsv } from "./csv";

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
console.log("csv check: ok");
