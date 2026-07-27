# Technical Notes, honest scorecard + ACP/UCP landscape

**What this repo is:** a research / point-of-view artifact on where agentic commerce is going, plus a **design-stage reference SDK** for the Agentic Commerce Protocol (ACP). It is not a shipping product and not an AI/LLM system. It is scored below on that basis, most engineering dimensions are honestly at "design-stage," and the AI-specific rubric dimensions largely **do not apply** because there is no model in the loop here. That is stated, not hidden.

Verified by running the repo:
- `demos/acp/acp-node`: ~1,250 lines TypeScript in `src/` (~2,200 total including tests and examples). `npm test` -> **35 passed (35)** via vitest (Error 11, Webhooks 14, ACP client 10).
- 9 typed error subclasses of `ACPError`. HMAC-SHA256 webhook verification with timing-safe compare and 300s tolerance. Fetch client with exponential backoff + jitter, 429 `Retry-After`, idempotency keys, request IDs. Dual CJS/ESM build config.

---

## 12-point rubric (scored for a design/research artifact)

| # | Dimension | Score | Evidence (file) | Gap |
|---|---|---|---|---|
| 1 | Model choice (LLM/ML/hybrid) | N/A | No model in this repo. It is the commerce *trust/integration layer* an agent would call. | If scored as a product: the agent using this SDK is the LLM; the OS itself is deterministic by design (correct choice, money movement should not be probabilistic). |
| 2 | How the AI works (context/temp/grounding) | N/A | No inference here. | The relevant grounding is elsewhere: an agent's purchase decision should be grounded in real catalog/price data, not hallucinated. |
| 3 | Tools / MCP (schemas, validation, errors) | 3 | `src/resources/*` expose typed operations; `src/types.ts` defines request/response schemas; `src/Error.ts` maps HTTP status -> 9 typed errors. This is effectively a clean tool surface an agent (or MCP server) would wrap. | No runtime input validation (relies on TS types only); no MCP server wrapper yet; UCP transport bindings (MCP/A2A) noted but not built. |
| 4 | Agents & skills | 1 (design-stage) | The whole repo is about giving agents a safe commerce capability; delegated-token model in `notes/acp-overview.md`. | No agent implementation in-repo; the agent is the caller. |
| 5 | Orchestration & routing | N/A | Not an inference system. | A real OS would route ACP vs UCP per merchant, the adapter layer is proposed in ARCHITECTURE.md. |
| 6 | RAG & context | N/A | No retrieval. | Merchant catalog/price grounding is the analogous concern; out of scope here. |
| 7 | Evals & grounding | 2 | 35 unit tests on security-sensitive plumbing (webhook signatures, error mapping, client construction). | No conformance/eval harness against the ACP spec, no LLM-judge or A/B (nothing to judge). Roadmap in EVALS.md. |
| 8 | Code quality | 4 | Stripe-patterned structure, clear separation (`net/`, `resources/`, `Error.ts`, `Webhooks.ts`), JSDoc throughout, dual CJS/ESM, prettier/eslint config, CI workflow present. Tests pass. | No runtime validation; examples reference an API host that is not live. |
| 9 | Scalability & cost | 3 | Client-side resilience is real: exponential backoff + jitter, capped retries, 429 handling, idempotency keys, per-request timeouts (`net/FetchHttpClient.ts`). | Backend scalability is N/A (no backend). Cost model undefined. |
| 10 | Guardrails & safety | 3 | Strong *conceptual* model: scoped tokens (max amount, merchant, expiry, reason), no raw credentials to the agent, timing-safe signature verification. Verification is implemented and tested. | Scope *enforcement*, revocation, per-agent limits, human-in-the-loop threshold, and kill switch are proposed, not built. Enforcement lives on the (absent) PSP side. |
| 11 | Product layer | 4 | PRD.md: personas (merchant, agent dev, PSP, buyer), JTBD, what a real Agent Commerce OS needs, metrics, tradeoffs, Now/Next/Later. Merchant-facing article in `articles/`. | Metrics are aspirational (no live usage). |
| 12 | FDE journey | 3 | FDE_JOURNEY.md: integration surface, secrets, rollout, observability, de-risking, reconciliation discipline. | Deployment is hypothetical, no customer, no live backend to integrate against. |

**Composite read:** as an *engineering artifact*, code quality and product thinking are strong (4s); the AI-specific dimensions largely don't apply because there is no model here; guardrails and evals are correctly identified but mostly still design-stage. The honest summary is: **a well-built reference client and a sharp point of view, not a production system.**

## Honesty flags found in the existing repo (recommend fixing)

These are pre-existing overclaims worth correcting so the repo reads as honest:

- **"production-ready SDK"** (root `README.md`, `notes/acp-overview.md`), it is a design-stage reference client with unit-tested plumbing but no live backend. Reworded in the revamped README to "design-stage reference SDK."
- **GitHub repo description** (currently "TypeScript SDK for agentic commerce protocols (ACP/UCP)... 35 passing tests"), the *35 tests are real and pass*, but the description (a) implies a UCP SDK when UCP is only a stub, and (b) frames a research artifact as a shipping SDK product. See the recommended corrected string in the revamped README / PR.
- **Package and repo naming:** the local package name is `agentic-commerce-sdk`, used consistently in the SDK README and examples, and the `package.json` `repository`, `homepage`, and `bugs` URLs point at the canonical repo `github.com/nikjain15/agent-commerce-os`. The SDK README carries only a license badge (no npm/CI badges). Names and links are consistent.
- **`resources.md` UCP links:** UCP is attributed to "Shopify + Google + Walmart" and links to `github.com/anthropics/universal-commerce-protocol`. **[VERIFY WITH NIK]:** confirm the exact UCP steward and canonical URL before publicizing; do not assert if unverified.
- **Article statistics:** the Stage 1 article cites third-party market stats with sources and uses two clearly fictional vignettes (Sarah, Alex). Fine as an opinion piece; not repo capability claims.

## ACP / UCP landscape (summarized from this repo's notes and comparison)

**ACP, Agentic Commerce Protocol** (`notes/acp-overview.md`)
- Stewarded by OpenAI + Stripe. Payment-first, REST/HTTP.
- Core primitives: **Delegate Payment** (token-based, scoped, prevents credential exposure), **Agentic Checkout** (session lifecycle `created -> payment_pending -> completed`), **Webhook events** (`checkout.completed/cancelled/expired`).
- Security model: agent never sees raw credentials; tokens scoped to session with max amount + expiry; HMAC-SHA256 signed webhooks. This is the model the reference SDK implements the client side of.

**UCP, Universal Commerce Protocol** (`notes/ucp-overview.md`, `comparisons/acp-vs-ucp.md`), *work in progress in-repo*
- Positioned as broader commerce interoperability across platforms, businesses, PSPs, and agents.
- Concepts noted: Checkout Capability with multiple transport bindings (REST, MCP, A2A), Identity Linking, Payment Handlers.
- **[VERIFY WITH NIK]** steward attribution and canonical docs URL.

**ACP vs UCP (as compared in-repo)**

| Aspect | ACP | UCP |
|---|---|---|
| Led by | OpenAI + Stripe | Broader consortium *(verify)* |
| Focus | Payment delegation + checkout | Full commerce interop (discovery -> fulfillment) |
| Transport | REST/HTTP | REST, MCP, A2A |
| Adoption bet | Simpler scope, faster | More flexible, more complex |

**The open question the repo poses (not yet answered in-repo):** will ACP and UCP converge? The thesis in PRD.md is to build a protocol-adapter-shaped integration surface so a merchant does not have to bet, the same discipline as keeping up/downstream systems in sync during a migration.

## Related standards referenced (`resources.md`)
AP2 (Agent Payments Protocol), A2A (Agent-to-Agent), MCP (Model Context Protocol), the surrounding ecosystem an Agent Commerce OS would interoperate with.
