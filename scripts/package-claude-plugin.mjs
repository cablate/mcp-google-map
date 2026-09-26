import { Buffer } from "node:buffer";
import { log } from "node:console";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { zipSync } from "fflate";

const rootPath = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(rootPath, "package.json"), "utf8"));
const artifacts = join(rootPath, "artifacts", "claude-plugin");
const pluginName = "mcp-google-map";
const staging = join(artifacts, pluginName);
const archiveName = `${pluginName}-claude-plugin-v${packageJson.version}.zip`;
const archivePath = join(artifacts, archiveName);

rmSync(artifacts, { recursive: true, force: true });
mkdirSync(join(staging, ".claude-plugin"), { recursive: true });
cpSync(join(rootPath, ".claude-plugin", "plugin.json"), join(staging, ".claude-plugin", "plugin.json"));
cpSync(join(rootPath, "skills"), join(staging, "skills"), { recursive: true });
for (const file of ["README.md", "README.zh-TW.md", "LICENSE"]) cpSync(join(rootPath, file), join(staging, file));

const manifest = JSON.parse(readFileSync(join(staging, ".claude-plugin", "plugin.json"), "utf8"));
if (manifest.name !== pluginName || manifest.version !== packageJson.version) {
  throw new Error("Claude plugin name/version must match the package release.");
}

function collect(directory, prefix = pluginName) {
  const entries = {};
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const archiveKey = `${prefix}/${name}`.replaceAll("\\", "/");
    if (statSync(path).isDirectory()) Object.assign(entries, collect(path, archiveKey));
    else entries[archiveKey] = new Uint8Array(readFileSync(path));
  }
  return entries;
}

const archive = Buffer.from(zipSync(collect(staging), { level: 9 }));
writeFileSync(archivePath, archive);
const digest = createHash("sha256").update(archive).digest("hex");
writeFileSync(`${archivePath}.sha256`, `${digest}  ${basename(archivePath)}\n`);

log(`plugin=${relative(rootPath, staging)}`);
log(`archive=${relative(rootPath, archivePath)}`);
log(`sha256=${digest}`);
