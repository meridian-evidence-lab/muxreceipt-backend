# Reproduce the public testnet milestone

Captured 23 October 2026. This is an early open-source pilot, not a production deployment.

## Read the deployed registry

Clone the sibling repositories listed in INTEGRATION.md. Use Node.js 24+:

```bash
npm ci
npm test
node verify-testnet.mjs
```

The last command makes read-only requests to Stellar testnet using the pinned official SDK 17.3.0. No account secret or wallet is required. It checks network passphrase, contract WASM hash, exact storage key and expected record values. A TLS RPC response is not an independently verified consensus proof.

- Contract: `CALJJITKSXKSCBSMOKHJGH5L7PAGE3DOCVLZA36S4KNY4RTA3FJAS3PE`
- WASM SHA-256: `444a11b403446363f43706155f89de68ab8c903705a739b94e4089d2f6d960a2`
- Deployment transaction: `aa4b51a5cf9d7caedd33a93567d9f486127dd285b0546982ea6017363c4ab3d6`
- Milestone transaction: `fc295e4cb3213b465417871003434a9ec34e4c3a14bf14ce4ec3b5b080b2de0b`
- Milestone ledger: 5346491

Full public inputs, recorded ledger, storage lifetime and successful HTTP response are in testnet-evidence.json. Contract artifacts were built with official Stellar CLI 28.1.0, soroban-sdk 29.0.1 and committed Cargo.lock using `stellar contract build --locked`. Only disposable Friendbot testnet funds were used. No signing secrets are distributed.

## HTTP verification

Set TESTNET_RPC_URL, TESTNET_CONTRACT_ID and TESTNET_WASM_HASH using `config` in the evidence file, then start the backend. POST the evidence file's `verificationInput` object as JSON to `/api/contracts/verify`. This endpoint does not sign or submit transactions. Network and code pins are operator configuration; request bodies cannot override them. Use existing API_TOKEN access gates if configured.

Failures distinguish missing configuration (503), malformed input (422), network/code/value mismatch (409), unavailable or archived entry (404), and RPC failure (502). A missing entry is not proof that it never existed. Testnet resets and storage expiry can invalidate a previously successful live check. TTL management remains an open contributor issue.

## What this demonstrates

Synthetic customer mapping commitment only. No customer payment or real funds are represented.

The scope and salted commitment can be recomputed using mappingProposal in the sibling contracts repository and syntheticMappingProof in the evidence. The published salt belongs only to this deliberately public synthetic fixture.
