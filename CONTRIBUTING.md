# Contributing

Read README.md, INTEGRATION.md, BACKLOG.md, and SECURITY.md first. Start with an issue that
states the problem, minimal synthetic fixture, expected outcome and acceptance test. Keep
customer exports, credentials and private mapping proofs out of issues and pull requests.

For frontend/backend changes, use Node.js 24+ and run npm test. Clone sibling repositories as
shown in INTEGRATION.md. For contracts, run cargo fmt --check, cargo test --locked, and
node --test proposal.test.mjs; use stellar contract build for a WASM build. Every PR should
explain its user-visible behavior, testing, and any API/schema or privacy implications.

Commit API changes with matching frontend and integration tests. Breaking normalized schemas
require an explicit version increment and migration notes. Keep hashes deterministic and use
exact decimal strings for monetary values and u64 IDs. Security reports use the private process
in SECURITY.md. Follow CODE_OF_CONDUCT.md in all project spaces.
