# Agent Skill demo (no MCP server)

This walkthrough verifies the no-MCP path end to end: the plugin's Agent Skills choose a geographic workflow, and the npm package CLI performs the API call. You do not need an MCP client or server.

## 1. Install the Skills

Install the Codex plugin from the CabLate marketplace:

```bash
codex plugin marketplace add cablate/mcp-google-map --ref main
codex plugin add mcp-google-map@cablate
```

Start a new conversation after installation. For a manual installation in another Skill-compatible agent, clone a chosen release tag and copy the whole `skills/` tree according to that client's instructions. Keep the three Skill folders and `_shared/` together. Installing the npm package alone does not register a Skill.

Check that your agent can discover `google-maps`, `google-maps-travel-planning`, and `google-maps-local-seo`, and can run shell commands. Provide a Google Maps Platform API key to the agent's environment as `GOOGLE_MAPS_API_KEY` through your normal secret-management method; never paste it into the prompt or commit it. Node.js 18+ and `npx` must be available. Enable Places API (New) and Routes API for workflows that use them.

## 2. Validate without an API call

For a marketplace installation, run:

```bash
npx -y @cablate/mcp-google-map doctor
```

For a cloned repository, install and build the package, then run the same check against the checkout:

```bash
npm ci
npm run build
node dist/cli.js doctor
```

Success means the Node.js, package, and API-key checks pass and `live-api` is skipped. This check makes no Google API requests. To test Geocoding, Places (New), and Routes, run the same command with `--live`; those calls may be billable.

## 3. Try one live request

Ask your agent:

> Use the google-maps Skill, without MCP, to find the coordinates of Tokyo Tower. Tell me which tool you used and cite Google Maps as the data source.

The agent should select `maps_geocode` and run an `exec geocode` call from the same checkout like:

```bash
node dist/cli.js exec geocode '{"address":"Tokyo Tower"}'
```

Success means the CLI exits 0 and returns JSON with `success: true`, a `data.location` latitude/longitude, and a `data.place_id`. The exact coordinates and address may change; do not compare them to a hard-coded snapshot. A failed call exits nonzero and writes JSON to stderr. This step calls a billable Google API using your key.

For a published-package check from **outside** this repository, the equivalent command is `npx -y @cablate/mcp-google-map doctor`. Running `npx` inside a checkout of the same package can resolve the local package instead of the published executable.

If you ask for place reviews, photos, or an AI summary in a later step, read the shared [content-attribution guidance](../skills/_shared/content-attribution.md) before displaying them. This geocoding example does not validate every Google Maps Platform policy requirement for a downstream app.
