# Agent Commerce OS

A research thesis and reference architecture for agentic commerce, backed by a design-stage TypeScript reference client for the Agentic Commerce Protocol (ACP).

## Project overview

This repository is a research artifact plus a proposed reference architecture for how AI agents will buy on a person's behalf. It pairs written analysis of the emerging standards (ACP and UCP), the delegated-payment trust model, and what a real Agent Commerce OS would need, with a design-stage reference SDK that implements the client side of ACP. It is aimed at merchants, agent developers, payment providers, and anyone evaluating agentic commerce. It is not a shipping product: there is no live backend, no live checkout, and no production users. Everything is labeled "in repo" or "proposed."

## Tech stack

- Documentation and research: Markdown, with Mermaid diagrams in the architecture docs.
- Reference SDK (`demos/acp/acp-node/`): TypeScript targeting ES2022, dual CommonJS and ESM builds via `tsc`.
- Runtime: Node.js 18 or newer, no runtime dependencies (native `fetch` and `crypto`).
- Tooling: Vitest for tests, ESLint for linting, Prettier for formatting.
- CI: GitHub Actions running lint, tests, and build on Node 18, 20, and 22.

## Setup

The documentation at the repository root needs no build or install: read the Markdown directly.

For the reference SDK:

```bash
cd demos/acp/acp-node
npm install
```

## Build

The SDK produces both CommonJS and ESM outputs.

```bash
cd demos/acp/acp-node
npm run build        # builds both CJS and ESM
npm run build:cjs    # CommonJS only (tsconfig.cjs.json)
npm run build:esm    # ESM only (tsconfig.esm.json)
npm run clean        # remove dist/
```

## Testing

All test and quality commands live in `demos/acp/acp-node/package.json`. Run them from that directory. This is the regression suite; all of it should pass before a change lands.

```bash
cd demos/acp/acp-node
npm test         # vitest run, the full unit suite (35 tests across 3 files)
npm run test:watch   # vitest in watch mode
npm run lint     # eslint over src/ and test/
```

CI (`.github/workflows/ci.yml`) additionally runs `npm run build` and verifies the CJS and ESM entry points import cleanly across Node 18, 20, and 22.

## Code style and conventions

- Language: TypeScript in `strict` mode with `forceConsistentCasingInFileNames`.
- Formatting: Prettier, configured in `demos/acp/acp-node/.prettierrc`: semicolons on, single quotes, 2-space indent, ES5 trailing commas, 90-character print width. Run `npm run format` to apply.
- Linting: ESLint over `src/` and `test/`.
- Naming: resource and class files use PascalCase (`CheckoutSessions.ts`, `Webhooks.ts`, `ACPResource.ts`); tests are `*.spec.ts` under `test/`.
- Imports: standard ESM `import` syntax; the build emits both module formats so keep imports free of format-specific assumptions.
- The SDK follows a Stripe-patterned client design: a top-level client exposing resource namespaces, a typed error taxonomy, and webhook signature helpers.

## Project structure

- `docs/` reference documentation. `PRD.md` (product thesis and personas), `ARCHITECTURE.md` (proposed reference architecture with Mermaid diagrams, marked "in repo" vs "proposed"), `TECHNICAL_NOTES.md` (honest scorecard and ACP/UCP landscape), `FDE_JOURNEY.md` (how the infrastructure would deploy into a merchant or payment environment), `EVALS.md` (evaluation roadmap).
- `notes/` background notes: `acp-overview.md` and `ucp-overview.md`.
- `comparisons/` `acp-vs-ucp.md`, comparing the two protocols.
- `articles/` merchant-facing writing, such as `ai-agents-learning-to-shop.md`.
- `resources.md` external references (ACP, UCP, AP2, A2A, MCP).
- `demos/acp/acp-node/` the design-stage ACP reference SDK. Its `src/` holds the client and resources: `acp.ts` (top-level client), `resources/` (`CheckoutSessions.ts`, `DelegatePayment.ts`), `Webhooks.ts` (HMAC-SHA256 signature verification), `Error.ts` (typed error classes), `ACPResource.ts`, `net/` (HTTP client abstraction and `fetch` implementation), `types.ts`, and `index.ts`. Its `test/` holds Vitest specs (`acp.spec.ts`, `Webhooks.spec.ts`, `Error.spec.ts`), `examples/` holds usage samples (`basic-checkout.ts`, `webhook-handler.ts`, `shopify-integration.ts`), and `types/` holds published type declarations.
- `demos/ucp/` placeholder for future UCP demos.

## Commit and PR guidelines

- Branch off `main` for changes; open a pull request back into `main`.
- Keep commit messages short and imperative, describing the change.
- All checks must pass before merge: lint, the full Vitest suite, and the build across the supported Node versions, as run by CI.
- Keep documentation honest and forward-looking. Distinguish what exists "in repo" from what is "proposed" or on the roadmap, matching the framing already used in `README.md` and `docs/`.
- Prose style in Markdown: use commas, colons, or periods as separators rather than em dashes or a spaced hyphen. Compound-word hyphens (multi-model, event-driven, real-time) are fine.

## Security and secrets

- No secrets are committed. The SDK reads its API key from the `ACP_API_KEY` environment variable, or accepts it as a constructor argument; if neither is present the client throws at construction time.
- Webhook verification uses a signing secret passed at call time (for example from `WEBHOOK_SECRET`), never hardcoded. Signature checks are HMAC-SHA256, timing-safe, and enforce a timestamp tolerance.
- The API key is sent only as a server-side `Authorization: Bearer` header; it is never intended to reach a browser or client bundle. The delegated-payment model means the agent works with scoped tokens (bounded by max amount, merchant, and expiry) rather than raw card data.
- `.gitignore` in the SDK excludes `.env`, `.env.local`, `node_modules/`, `dist/`, and build artifacts. Keep real credentials in untracked environment files.
