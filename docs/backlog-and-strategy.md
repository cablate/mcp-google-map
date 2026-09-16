# mcp-google-map backlog

This is a current maintenance and product roadmap, not a release-status ledger. For the current version and tool count, use [`package.json`](../package.json) and the [README](../README.md), not a number copied into this file. Earlier market-size claims, competitor counts, and growth forecasts were removed because they had no maintained evidence or expiry date; Git history retains them if historical context is needed.

## Product quality and adoption

1. **Agent Skill onboarding evidence.** The [no-MCP walkthrough](../examples/agent-skill-demo.md) documents a reproducible CLI path. Test actual Skill discovery and tool selection in representative clients before claiming cross-client support. A short screen recording may then show the verified flow; do not substitute a staged transcript for an observed run.
2. **Geo-reasoning evaluation.** Start with a small set of versioned tasks that exercise tool selection, parameters, result interpretation, cost, and latency. Publish raw task definitions and evaluation criteria with any result; do not make an unsupported “tool vs no tool” success-rate claim.
3. **MCP prompt templates.** Consider travel planning, neighborhood scouting, and multi-stop routing templates only after checking which target MCP clients expose prompts to users. Reuse the existing Skill recipes where appropriate; avoid maintaining two divergent sets of instructions.
4. **Contributor feedback.** Collect reproducible user reports and installation friction before expanding the tool catalog. Existing tools cover geocoding, search, routes, environment data, maps, and four composite workflows.

## Trust and maintenance

- Keep Google Maps content display guidance aligned with the [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies), particularly attribution for reviews/photos, AI-summary disclosures, source links, and storage limits. The package is a data/tool layer; downstream applications still own their rendered UI, terms, and privacy notices.
- Triage production dependency advisories by affected path and exploit preconditions, then update compatible versions and verify build, tests, and live API behavior. An audit count alone is not proof of an exploitable path.
- Keep the packaged Agent Skill synchronized with its source using `python3 scripts/package-skill.py --check` in CI. Update its tool map and API reference whenever tools change.

## Deferred ideas

- **Isochrone approximation:** Google Maps Platform has no direct isochrone API in this project. An approximate polygon from distance-matrix probes needs a concrete user requirement and accuracy/cost bounds before implementation.
- **Geo-agent scaffold:** A separate starter template may be useful after the Skill onboarding study; first determine which setup steps are not already covered by the Skill and README.
- **Directory and content submissions:** Validate each directory's current submission path and requirements before spending maintainer time. Prefer a verified demo and honest capability claims over stale comparison tables.

## Previously rejected

| Idea | Reason to revisit only with new evidence |
|------|------------------------------------------|
| Address Validation tool | Separate pricing and a narrower use case than existing geocoding |
| Spatial memory layer | Would duplicate host-agent conversation state without a demonstrated gap |
| Language parameter on every tool | Broad API change without a validated user need |
