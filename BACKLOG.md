# Contributor backlog

## P0 · Verified Stellar export adapter

Use an official pinned SDK to decode real testnet events; preserve event IDs and failed/successful status; reject unknown network or unsupported schemas. Acceptance: provenance-documented fixtures reproduce core results.

## P0 · Contract state read-back

Read the deployed registry through a verified network configuration and compare returned digests/revisions. Acceptance: wrong-network and mismatched-digest examples fail visibly.

## P0 · Wallet-signed testnet flow

Allow an operator to inspect and sign a simulated invocation. Acceptance: refusal, failed simulation and failed submission produce no success badge; no secret key reaches the API.

## P1 · Release dependency locking

Pin sibling commit SHAs and SDK/toolchain versions for a tested release. Acceptance: fresh clone reproduces CI and the complete UI→API→core flow.

## P1 · Accessible interaction tests

Add keyboard and screen-reader tests for imports, errors, audit history and findings. Acceptance: every action is reachable without a pointer and status changes are announced.

## P1 · Database migrations and recovery

Version the schema and document backup/restore. Acceptance: migration tests preserve report digests and restart does not duplicate audits.

## P1 · Contract lifecycle governance

Design TTL monitoring, state restoration and admin/key recovery. Acceptance: archival/recovery tests cannot silently reset revision history.
