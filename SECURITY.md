# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x (current) | Yes |

Only the latest release in the `0.x` line receives security fixes.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email the maintainer directly at **reahtuoo310109@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce or a proof-of-concept
- The potential impact
- Any suggested mitigations (optional)

You will receive an acknowledgment within **48 hours**. After triage, we will work with you on a coordinated disclosure timeline.

## Scope

The primary security concern for this project is the handling of the `GOOGLE_MAPS_API_KEY` environment variable. Never commit your API key to version control. Use `.env` files that are listed in `.gitignore`.

For a detailed security assessment, see [SECURITY_ASSESSMENT.md](./SECURITY_ASSESSMENT.md).
