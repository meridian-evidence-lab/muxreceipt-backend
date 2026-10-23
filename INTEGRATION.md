# MuxReceipt: connected development guide

## Repository map

| Repository | Responsibility |
|---|---|
| `muxreceipt-frontend` | Browser workspace, local API gateway, JSON imports and evidence review |
| `muxreceipt-backend` | HTTP API, SQLite audit/mapping persistence, orchestration and health |
| `muxreceipt-contracts` | Soroban registry, authorization tests, shared digest/proposal module |
| `muxreceipt-core` | Deterministic audit decisions and normalized data validation |
| `muxreceipt-cli` | Independent operator automation |
| `muxreceipt-scenarios` | Shared adversarial inputs and expected outcomes |
| `muxreceipt-review` | Escaped HTML report rendering, reused by the API |

## Clone and run

Keep the repositories as siblings. Node.js 24+ is needed for the API's built-in SQLite support.
The frontend and backend have no npm dependencies to install.

```bash
mkdir muxreceipt-workspace
cd muxreceipt-workspace
git clone https://github.com/meridian-evidence-lab/muxreceipt-core.git
git clone https://github.com/meridian-evidence-lab/muxreceipt-cli.git
git clone https://github.com/meridian-evidence-lab/muxreceipt-scenarios.git
git clone https://github.com/meridian-evidence-lab/muxreceipt-review.git
git clone https://github.com/meridian-evidence-lab/muxreceipt-frontend.git
git clone https://github.com/meridian-evidence-lab/muxreceipt-backend.git
git clone https://github.com/meridian-evidence-lab/muxreceipt-contracts.git
cd muxreceipt-frontend
npm run dev
```

Open http://127.0.0.1:4310. The API runs at http://127.0.0.1:4311.
Load the synthetic sample, run an audit, inspect findings, reload a saved audit, and open the
HTML evidence export. SQLite data persists under `muxreceipt-backend/data/`.
Ctrl-C stops both processes. The gateway keeps any configured API token on the server side.

For separate processes, run `npm start` in the backend and frontend in separate terminals.
Copy `.env.example` to `.env` in each repository to customize standalone startup. If using
API_TOKEN, set the same value in both environments. npm run dev uses the documented fixed
ports; for custom ports use the separate processes and configure the backend allowed origins
in createApp. The services bind only to loopback and are development tools, not a hosted multi-user service.

## End-to-end data flow

1. Browser imports a normalized JSON export; files larger than 1 MiB are refused.
2. Same-origin frontend proxy forwards to the local backend.
3. Backend validates bounds, invokes the existing core, and persists input/report in SQLite.
4. Browser displays actual report classifications and reloadable history.
5. The existing review renderer produces downloadable HTML evidence.
6. The contracts proposal module produces the exact registry method and ABI argument names.
7. An external signer can publish a reviewed proposal after deploying the appropriate contract.

No live transaction submission is implemented. Unsigned JSON proposals are not XDR transactions.
The Node proposal tests verify digest construction; Soroban tests verify registry authorization
and state transitions. Contract-chain confirmation is deliberately not simulated or fabricated.

## Contract use

Rust stable plus the official Stellar CLI are required. The contract pins soroban-sdk 29.0.1,
uses `lib.rs` as its root, and has a committed Cargo.lock. It uses established host features,
not Bell-only functions. Verify CLI/SDK compatibility before deployment.

```bash
cd ../muxreceipt-contracts
cargo test --locked
node --test proposal.test.mjs
stellar contract build
```

`stellar contract build` uses the supported wasm32v1-none target; do not substitute the older
wasm32-unknown-unknown target. Deployment and invocation require an operator-managed testnet
identity. No keys are shipped. See ABI.json and the contract README for methods and limits.

## API and adapter boundaries

`muxreceipt-backend/openapi.json` is the initial API contract. Normalized input follows the
existing core sample. GET /api/network optionally checks an operator-configured RPC_URL with
getNetwork and getHealth. The API does not yet decode or ingest raw Stellar XDR, verify provider
coverage, or read contract state. The adapter interfaces and unsigned proposal output make those
next contributions explicit without treating unverified inputs as chain evidence.

## Validation

Run `npm test` in frontend and backend. The frontend integration test starts a real API and
proxy, imports the core sample, persists an audit, and renders an evidence export. Backend tests
cover database restart, invalid-input atomicity, access gates, and proposal integration.
Each repository's CI checks out the sibling dependencies it actually needs.

## Release checklist

- Complete the prioritized BACKLOG.md issues with acceptance tests.
- Pin cross-repository commit SHAs for a release; development CI currently tracks sibling main.
- Add verified SDK normalization, contract read-back and wallet signing for a testnet pilot.
- Review security, privacy, storage archival, resource usage and migration behavior.
