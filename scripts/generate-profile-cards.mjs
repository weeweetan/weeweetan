import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const renderer = path.resolve(process.argv[2] || ".stats-renderer");
const username = process.env.GITHUB_REPOSITORY_OWNER;
assert(username && process.env.PAT_1, "Repository owner and GitHub token are required");

// The upstream query requests the stargazers connection, which GITHUB_TOKEN
// cannot access across repositories. The public scalar provides the same count
// without requesting the list of users. Fail if the pinned source ever changes.
const fetcherPath = path.join(renderer, "src/fetchers/stats.js");
let source = await readFile(fetcherPath, "utf8");
for (const [before, after] of [
  ["stargazers {\n        totalCount\n      }", "stargazerCount"],
  ["node.stargazers.totalCount", "node.stargazerCount"],
  ["curr.stargazers.totalCount", "curr.stargazerCount"],
]) {
  assert.equal(source.split(before).length, 2, `Unexpected renderer source: ${before}`);
  source = source.replace(before, after);
}
await writeFile(fetcherPath, source);

const { default: statsApi } = await import(pathToFileURL(path.join(renderer, "api/index.js")));
const { default: langsApi } = await import(pathToFileURL(path.join(renderer, "api/top-langs.js")));
const palettes = [
  { suffix: "", bg_color: "f7fbfd", title_color: "087f8c", text_color: "334155", icon_color: "0284c7", border_color: "d6e4eb" },
  { suffix: "-dark", bg_color: "08131e", title_color: "58e4c2", text_color: "b8c9d6", icon_color: "7cc7ff", border_color: "294052" },
];
const cards = [];
for (const { suffix, ...colors } of palettes) {
  for (const [name, handler, options] of [
    ["stats", statsApi, { show_icons: "true" }],
    ["top-langs", langsApi, { layout: "compact", langs_count: "6" }],
  ]) {
    const filename = `profile/${name}${suffix}.svg`;
    let svg = "";
    await handler(
      { query: { username, ...colors, ...options, disable_animations: "true" } },
      { setHeader() {}, send(value) { svg = value; } },
    );
    assert(typeof svg === "string" && svg.includes("<svg"), `Empty card: ${filename}`);
    assert(!/something went wrong/i.test(svg), `Failed to fetch statistics: ${filename}`);
    cards.push([filename, svg]);
  }
}

// Only replace cached cards after every API request has succeeded.
await mkdir("profile", { recursive: true });
for (const [filename, svg] of cards) {
  await writeFile(filename, svg);
  console.log(`Wrote ${filename}`);
}
