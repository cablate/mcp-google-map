# Agent Skill demo (no MCP server)

This walkthrough demonstrates the two pieces separately: the plugin's Agent Skills tell an agent which geographic workflow and tool to use, and the package CLI performs the API call. It does not require an MCP client or server. Build and run the CLI from the same repository revision as the Skills so the instructions and executable stay aligned.

## 1. Install the Skills

Prefer installing the Codex plugin from the CabLate marketplace. For a manual installation, clone a chosen release tag and copy the whole `skills/` tree according to the client's instructions. Keep the three Skill folders and `_shared/` together. Installing npm alone does not register a Skill unless it is installed through the plugin marketplace.

Check that your agent can discover `google-maps`, `google-maps-travel-planning`, and `google-maps-local-seo`, and can run shell commands. Provide a Google Maps Platform API key to the agent's environment as `GOOGLE_MAPS_API_KEY` through your normal secret-management method; never paste it into the prompt or commit it. Node.js 18+ and `npx` must be available.

## 2. Validate without an API call

From the cloned repository, install and build the package, then run the local doctor:

```bash
npm ci
npm run build
node dist/cli.js doctor
```

The report should pass the Node.js, package, and API-key checks and skip `live-api`. It makes no Google API requests. To test Geocoding, Places (New), and Routes after disclosing that the calls may be billable, run `node dist/cli.js doctor --live`.

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
