# Security Policy

## Supported Versions

Security updates are applied directly to the `main` branch and deployed automatically.

| Version | Supported |
| --- | --- |
| `2.x` (`main`) | ✅ Active |
| `< 2.0` | ❌ Unsupported |

## Reporting a Vulnerability

If you discover a security issue (for example, Firestore rule bypasses, XSS, authentication flaws, or exposed private credentials):

1. **Do not** open a public GitHub issue with exploit details.
2. Report it privately using GitHub's **Security → Advisories → Report a vulnerability** tab on [`codewithyuvraj24/ola-charge-tracker`](https://github.com/codewithyuvraj24/ola-charge-tracker/security/advisories).
3. Include steps to reproduce, affected files/routes, and potential impact.

You will receive an acknowledgment within **48 hours** and a resolution plan as soon as the issue is confirmed.

## Security Architecture Notes

- User data isolation and numeric range validation are enforced server-side via [`firestore.rules`](./firestore.rules).
- `NEXT_PUBLIC_FIREBASE_*` keys are public Firebase client identifiers; always pair them with Google Cloud HTTP referrer + API restrictions and deployed Firestore Security Rules.
- Production HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are configured in [`next.config.mjs`](./next.config.mjs).
