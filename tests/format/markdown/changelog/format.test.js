const changelogWithBullets = `# Changelog

## 1.2.3

- Added a thing
- Fixed another thing

## 1.2.0

- Older change
`;

const changelogWithSubSection = `# Changelog

## 2.0.0

### Breaking changes

- Removed the old API

## 1.9.0

- A normal change
`;

const changelogPrerelease = `# Changelog

## 1.0.0-beta.1

- Beta change
`;

// (a) default: compact-on for CHANGELOG.md
// (d) multiple version headings
// (e) version heading followed by bullets AND one followed by a sub-section
runFormatTest(
  {
    importMeta: import.meta,
    snippets: [
      {
        code: changelogWithBullets,
        name: "compact-default-bullets",
        filename: "CHANGELOG.md",
      },
      {
        code: changelogWithSubSection,
        name: "compact-default-subsection",
        filename: "CHANGELOG.md",
      },
      {
        code: changelogPrerelease,
        name: "compact-default-prerelease",
        filename: "CHANGELOG.md",
      },
    ],
  },
  ["markdown"],
);

// (b) opt-out restores prettier's blank line
runFormatTest(
  {
    importMeta: import.meta,
    snippets: [
      {
        code: changelogWithBullets,
        name: "opt-out-bullets",
        filename: "CHANGELOG.md",
      },
    ],
  },
  ["markdown"],
  { changelogCompactVersions: false },
);

// (c) a non-CHANGELOG `.md` file is unaffected (blank line preserved even with
// the feature on by default)
runFormatTest(
  {
    importMeta: import.meta,
    snippets: [
      {
        code: changelogWithBullets,
        name: "non-changelog-unaffected",
        filename: "RELEASES.md",
      },
    ],
  },
  ["markdown"],
);
