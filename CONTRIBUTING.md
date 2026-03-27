# Contributing to mcp-google-map

Thank you for your interest in contributing. This guide covers how to report bugs, suggest features, set up a dev environment, and submit pull requests.

## Bug Reports

Open an issue at [GitHub Issues](https://github.com/cablate/mcp-google-map/issues) and include:

- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS
- Any relevant logs or error output

## Feature Suggestions

Open an issue with the label `enhancement`. Describe:

- The problem you are trying to solve
- Your proposed solution
- Any alternatives you considered

## Development Setup

**Prerequisites:** Node.js >= 18, npm

```bash
# Clone the repository
git clone https://github.com/cablate/mcp-google-map.git
cd mcp-google-map

# Install dependencies
npm install

# Build
npm run build
```

Copy `.env.example` to `.env` and fill in `GOOGLE_MAPS_API_KEY` before running locally.

### Running Tests

```bash
# Smoke tests (no API key required)
npm test

# Full E2E tests (requires GOOGLE_MAPS_API_KEY)
npm run test:e2e
```

## Pull Request Process

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and ensure the build and tests pass:
   ```bash
   npm run build
   npm test
   ```
3. Commit using a clear message in the imperative mood (e.g., `feat: add place autocomplete tool`).
4. Push your branch and open a pull request against `main`.
5. Fill in the PR description, link any related issues, and wait for a review.
6. Once approved and all checks pass, the maintainer will merge.

## Code Style

- TypeScript strict mode is expected.
- Keep tool definitions under `src/tools/maps/`.
- Use `camelCase` for variables/functions, `PascalCase` for classes/interfaces, `UPPER_SNAKE_CASE` for constants.
- Match the existing file and naming conventions.
- Run `npm run build` before committing — the build must pass cleanly.

## Questions?

Reach out at [reahtuoo310109@gmail.com](mailto:reahtuoo310109@gmail.com) or open a GitHub Discussion.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
