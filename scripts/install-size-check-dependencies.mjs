import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function prepareLockfile(lockfile, packageName, isCurrent) {
  if (isCurrent) {
    return lockfile;
  }

  const [header, ...entries] = lockfile.split(/\n(?=")/u);
  const roots = entries.filter((entry) =>
    /^"[^"\n]+@workspace:\.":\n/u.test(entry),
  );
  assert.equal(roots.length, 1, "Expected one root workspace lockfile entry.");
  const root = roots[0];
  const [descriptor] = root.split(":\n", 1);
  const expected = JSON.stringify(`${packageName}@workspace:.`);
  if (descriptor === expected) {
    return lockfile;
  }

  // Historical fork revisions can rename the package without updating its workspace
  // locator. Preserve every dependency, checksum, and version before immutable install.
  const resolution = `  resolution: ${descriptor}\n`;
  assert.ok(
    root.includes(resolution),
    "Expected the root workspace resolution.",
  );
  entries[entries.indexOf(root)] = root
    .replace(`${descriptor}:\n`, `${expected}:\n`)
    .replace(resolution, `  resolution: ${expected}\n`);
  return [header, ...entries.sort()].join("\n");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  assert.ok(
    process.env.SIZE_CHECK_HEAD,
    "SIZE_CHECK_HEAD must identify the PR revision.",
  );
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const { name } = JSON.parse(readFileSync("package.json", "utf8"));
  const lockfile = readFileSync("yarn.lock", "utf8");
  const prepared = prepareLockfile(
    lockfile,
    name,
    revision === process.env.SIZE_CHECK_HEAD,
  );
  if (prepared !== lockfile) {
    writeFileSync("yarn.lock", prepared);
    console.log(
      "Aligned the historical root workspace locator without changing dependencies.",
    );
  }
  const result = spawnSync("yarn", ["install", "--immutable"], {
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  process.exit(result.status ?? 1);
}
