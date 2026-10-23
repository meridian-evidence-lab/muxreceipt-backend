# MuxReceipt · Audit API and persistence

A real Node.js HTTP service using SQLite. It invokes the existing core and review packages as sibling imports, saves inputs and reports atomically, enforces input bounds and local access gates, and exposes contract proposal preparation. Mapping lists can be saved locally for MuxReceipt. LedgerOrder persists paired-export comparisons.

**Version 0.2.0 — connected local-development scaffold.** This is functional development software,
not an audited production service. It is part of the [meridian-evidence-lab](https://github.com/meridian-evidence-lab) open-source project.

## Start here

Read [INTEGRATION.md](INTEGRATION.md) for complete clone commands, the seven-repository map,
local run instructions, API behavior and contract boundaries.

```bash
npm ci
npm test
npm start
```

Node.js 24+ is required. Clone the sibling core, review, contracts and backend repositories
as described in the integration guide. Run `npm ci` in this backend before using registry verification. The official Stellar SDK is pinned with package-lock.json.

## Contributing

[BACKLOG.md](BACKLOG.md) lists prioritized, testable contributions. Follow
[CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
Report vulnerabilities through the private process in [SECURITY.md](SECURITY.md).
Source is MIT-licensed. No Drips approval, security audit, or mainnet deployment is claimed.

## Testnet registry verification

POST `/api/contracts/verify` reads the configured testnet registry and checks its network, pinned WASM hash and exact stored commitments. It does not sign, simulate a write, or submit transactions. See TESTNET.md for deployment evidence and reproducible commands. Missing/archived records are not marked verified.
