import { prepareLockfile } from "../../scripts/install-size-check-dependencies.mjs";

const header = "# Yarn lockfile\n\n__metadata:\n  version: 8\n";
const dependency =
  '"dependency@npm:1.0.0":\n  version: 1.0.0\n  checksum: unchanged\n';
const workspace = (name) =>
  `"${name}@workspace:.":\n  version: 0.0.0-use.local\n  resolution: "${name}@workspace:."\n  dependencies:\n    dependency: "npm:1.0.0"\n`;
const lockfile = `${header}\n${dependency}\n${workspace("original")}`;

test("Never repairs the current PR lockfile", () => {
  expect(prepareLockfile(lockfile, "@fork/package", true)).toBe(lockfile);
});

test("Preserves historical dependency entries and sorts the renamed workspace", () => {
  expect(prepareLockfile(lockfile, "@fork/package", false)).toBe(
    `${header}\n${workspace("@fork/package")}\n${dependency}`,
  );
});

test("Leaves matching historical metadata byte-identical", () => {
  expect(prepareLockfile(lockfile, "original", false)).toBe(lockfile);
});

test("Is deterministic and idempotent", () => {
  const prepared = prepareLockfile(lockfile, "@fork/package", false);
  expect(prepareLockfile(lockfile, "@fork/package", false)).toBe(prepared);
  expect(prepareLockfile(prepared, "@fork/package", false)).toBe(prepared);
});

test("Rejects missing or ambiguous root workspaces", () => {
  expect(() =>
    prepareLockfile(`${header}\n${dependency}`, "renamed", false),
  ).toThrow();
  expect(() =>
    prepareLockfile(`${lockfile}\n${workspace("another")}`, "renamed", false),
  ).toThrow();
});

test("Rejects inconsistent root resolutions", () => {
  expect(() =>
    prepareLockfile(
      lockfile.replace(
        'resolution: "original@workspace:."',
        'resolution: "other"',
      ),
      "renamed",
      false,
    ),
  ).toThrow();
});

test("Does not confuse nested workspaces with the root", () => {
  const nested = '"nested@workspace:packages/nested":\n  version: 0.0.0\n';
  expect(prepareLockfile(`${lockfile}\n${nested}`, "renamed", false)).toContain(
    nested,
  );
});
