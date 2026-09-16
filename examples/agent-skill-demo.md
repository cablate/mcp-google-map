# Agent Skill demo (no MCP server)

This walkthrough demonstrates the two pieces separately: the Agent Skill tells an agent which geographic tool to use, and the package CLI performs the API call. It does not require an MCP client or server. Build and run the CLI from the same repository revision as the Skill so the instructions and executable stay aligned.

## 1. Install the Skill

Clone this repository at a chosen release tag, then copy the whole `skills/google-maps/` directory into your agent's Skills directory according to that client's instructions. Keep `SKILL.md` and `references/` together. If the client accepts `.skill` archives, import `skills/google-maps/SKILL.skill` instead. Installing npm alone does not register the Skill.

Check that your agent can discover `google-maps` and run shell commands. Provide a Google Maps Platform API key to the agent's environment as `GOOGLE_MAPS_API_KEY` through your normal secret-management method; never paste it into the prompt or commit it. Node.js 18+ and `npx` must be available.

## 2. Validate without an API call

From the cloned repository, install and build the package, then run its CLI help:

```bash
npm ci
npm run build
node dist/cli.js exec --help
```

The help should list `geocode` and `search-places`. This only checks CLI availability; it does not prove that your key or Google APIs are enabled.

## 3. Try one live request

Ask your agent:

> Use the google-maps Skill, without MCP, to find the coordinates of Tokyo Tower. Tell me which tool you used and cite Google Maps as the data source.

The agent should select `maps_geocode` and run an `exec geocode` call from the same checkout like:

```bash
node dist/cli.js exec geocode '{"address":"Tokyo Tower"}'
```

Success means the CLI exits 0 and returns JSON with `success: true`, a `data.location` latitude/longitude, and a `data.place_id`. The exact coordinates and address may change; do not compare them to a hard-coded snapshot. A failed call exits nonzero and writes JSON to stderr. This step calls a billable Google API using your key.

For a published-package check from **outside** this repository, the equivalent command is `npx -y @cablate/mcp-google-map exec --help`. Running `npx` inside a checkout of the same package can resolve the local package instead of the published executable.

If you ask for place reviews, photos, or an AI summary in a later step, read the Skill's [content-attribution guidance](../skills/google-maps/references/content-attribution.md) before displaying them. This geocoding example does not validate every Google Maps Platform policy requirement for a downstream app.
