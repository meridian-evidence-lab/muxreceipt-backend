# Architecture and trust boundaries

A real Node.js HTTP service using SQLite. It invokes the existing core and review packages as sibling imports, saves inputs and reports atomically, enforces input bounds and local access gates, and exposes contract proposal preparation. Mapping lists can be saved locally for MuxReceipt. LedgerOrder persists paired-export comparisons.

## Dependency graph

Frontend → backend → core + review + contracts/proposal.mjs.
Contracts use soroban-sdk 29.0.1. The CLI and scenarios stay independent operator/testing tools.
See INTEGRATION.md for the runnable data flow and openapi.json in the backend for HTTP routes.

## What is verified

Core rules operate on normalized inputs, not authenticated ledger records. Provider labels are
caller-supplied. A local audit may agree with another export while both omit the same event.
Contract proposal JSON is explicitly unsigned; no deployment, signing, simulation or submission
is silently performed. A public commitment can establish publication and revision order, not
customer identity, reserve sufficiency, compliance, or source completeness.

## Persistence and access

The API writes audit inputs/reports into SQLite using prepared statements. Mapping updates are
validated as a whole before replacement. Services bind to 127.0.0.1, restrict Host/Origin, accept
optional API_TOKEN, and bound JSON imports to 1 MiB. No web-accessible multi-tenant authentication
is present. SQLite inputs may contain sensitive metadata; keep data/ and .env out of Git.
Production deployments need authenticated tenant isolation, retention/privacy policy, migrations,
rate limits, robust worker orchestration, and independent review.

## Pinned testnet read-back

POST /api/contracts/verify reads registry state through the official SDK, verifies testnet identity and pinned WASM, and compares the requested storage record. RPC transport is trusted; no consensus-proof verification or transaction signing is performed. See TESTNET.md for reproducible public evidence.
