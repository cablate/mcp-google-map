import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

interface PluginManifest {
  name: string;
  version: string;
  skills?: string;
  mcpServers?: unknown;
}

interface PackageManifest {
  version: string;
  files: string[];
}

interface Marketplace {
  name: string;
  plugins: Array<{
    name: string;
    source: Record<string, string>;
    policy: { installation: string; authentication: string };
  }>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8")) as T;
}

test("plugin package is Skill-only and versioned with the npm package", () => {
  const packageJson = readJson<PackageManifest>("package.json");
  const portableManifest = readJson<PluginManifest>("plugin.json");
  const codexManifest = readJson<PluginManifest>(".codex-plugin/plugin.json");

  assert.equal(portableManifest.name, "mcp-google-map");
  assert.equal(codexManifest.name, portableManifest.name);
  assert.equal(portableManifest.version, packageJson.version);
  assert.equal(codexManifest.version, packageJson.version);
  assert.equal(codexManifest.skills, "./skills/");
  assert.equal("mcpServers" in portableManifest, false);
  assert.equal("mcpServers" in codexManifest, false);
  assert.ok(packageJson.files.includes("plugin.json"));
  assert.ok(packageJson.files.includes(".codex-plugin"));
});

test("plugin exposes three focused Skills with shared diagnostics", () => {
  const skillNames = ["google-maps", "google-maps-travel-planning", "google-maps-local-seo"];

  for (const skillName of skillNames) {
    const skillUrl = new URL(`../skills/${skillName}/SKILL.md`, import.meta.url);
    assert.equal(existsSync(skillUrl), true, `${skillName} entrypoint exists`);
    const contents = readFileSync(skillUrl, "utf8");
    assert.match(contents, new RegExp(`^name: ${skillName}$`, "m"));
    assert.match(contents, /\.\.\/_shared\/setup-and-diagnostics\.md/);
  }

  assert.equal(existsSync(new URL("../skills/_shared/SKILL.md", import.meta.url)), false);
  assert.equal(existsSync(new URL("../skills/_shared/setup-and-diagnostics.md", import.meta.url)), true);
  assert.equal(existsSync(new URL("../skills/_shared/content-attribution.md", import.meta.url)), true);
});

test("CabLate marketplace installs the published npm plugin", () => {
  const marketplace = readJson<Marketplace>(".agents/plugins/marketplace.json");
  const [plugin] = marketplace.plugins;

  assert.equal(marketplace.name, "cablate");
  assert.equal(plugin.name, "mcp-google-map");
  assert.deepEqual(plugin.source, {
    source: "npm",
    package: "@cablate/mcp-google-map",
    version: "latest",
    registry: "https://registry.npmjs.org",
  });
  assert.equal(plugin.policy.installation, "AVAILABLE");
  assert.equal(plugin.policy.authentication, "ON_INSTALL");
});
