# PRD - Agent Commerce OS (thesis + reference architecture)

**Status:** Point-of-view / research artifact with a design-stage reference SDK. This is not a shipping product. Everything here is either (a) present in this repo today, or (b) explicitly framed as roadmap.

**One-line thesis:** As AI agents start to buy on people's behalf, commerce needs a thin, boring, verifiable trust layer - scoped payment delegation, session-based checkout, and signed events - so that a merchant, an agent, and a payment provider can transact without any of them having to trust the others.

---

## 1. The problem

Autonomous agents (ChatGPT, Perplexity, custom assistants) are moving from *recommending* purchases to *completing* them. That breaks assumptions baked into a decade of e-commerce:

- **Credentials.** A card number handed to an agent is a card number exposed to a model, its logs, and its tool-call transcripts. The web checkout assumes a human at a browser with a cookie session, not a program holding a bearer token.
- **Authority and limits.** "Buy sneakers under $50" has to become an enforceable spending scope, not a hopeful instruction. There is no native way to say "this agent may spend up to $50 at this merchant, once, in the next 10 minutes."
- **Trust between strangers.** The merchant did not build the agent. The agent did not build the payment rails. Each needs to verify the others' actions cryptographically rather than by reputation.
- **Fragmentation.** Two overlapping standards are forming - ACP (OpenAI + Stripe, payment-first) and UCP (broader commerce interop). Merchants do not want to bet the store on one and rewrite for the other.

**The gap this repo explores:** what the *client-side integration surface* and *trust model* of agentic commerce should look like, and what a real "Agent Commerce OS" - the connective infrastructure a merchant would actually deploy - would have to do.

## 2. Personas and JTBD

| Persona | Job to be done | Today's pain |
|---|---|---|
| **Merchant / merchant-platform engineer** | "Let agents buy from me safely without exposing my payment stack or rewriting checkout for every agent." | No standard integration surface; unclear liability; two competing protocols. |
| **Agent developer** | "Let my agent complete a purchase within a spending limit, without ever touching raw card data." | Must handle payment credentials it should never see; no scoped, revocable authority primitive. |
| **Payment provider / PSP** | "Issue scoped, auditable payment authority to a non-human actor and settle it." | Fraud and chargeback models assume a human cardholder; delegation is ad hoc. |
| **End user (buyer)** | "Delegate a bounded task to my agent and stay in control of my money." | Binary trust - hand over the card or do it yourself; no middle ground. |

## 3. What a real Agent Commerce OS would need

Framed as target capabilities, not built features. What exists in this repo today is called out in ARCHITECTURE.md and TECHNICAL_NOTES.md.

1. **Scoped payment delegation** - issue a token bound to (merchant, max amount, currency, reason, expiry); never expose raw credentials to the agent. *(SDK surface exists: `delegatePayment.create`.)*
2. **Session-based checkout** - a checkout session as the unit of state, with a clear lifecycle (created -> payment_pending -> completed / cancelled / expired). *(SDK surface exists: `checkoutSessions` create/retrieve/update/complete/cancel.)*
3. **Signed, verifiable events** - HMAC-SHA256 webhook signatures with timestamp tolerance and timing-safe comparison, so a merchant can trust "this order really completed." *(Implemented and unit-tested in `Webhooks.ts`.)*
4. **Protocol adapters** - one integration surface that can speak ACP today and UCP as it matures. *(ACP client only today; UCP is a stub.)*
5. **Policy and guardrails** - human-in-the-loop for anything above a threshold; per-agent and per-merchant limits; kill switch. *(Roadmap.)*
6. **Observability and reconciliation** - request IDs, idempotency, an auditable trail from agent intent to settled order. *(Idempotency keys and request IDs exist in the HTTP client; reconciliation is roadmap.)*
7. **A live backend and real PSP integration.** *(Does not exist. The SDK targets a spec-facing host and is a reference client.)*

## 4. Success metrics (for the thesis, not vanity)

- **Clarity:** a reader can explain ACP's delegated-token trust model after 10 minutes in this repo.
- **Correctness:** the reference SDK's security-sensitive code (webhook verification, error taxonomy) is unit-tested and passes (35/35 today).
- **Reusability:** the proposed reference architecture is protocol-shaped, so it survives ACP/UCP convergence.
- **Decision value:** a merchant engineer can use the ACP-vs-UCP comparison to decide where to start.

If this became a product, the operating metrics would be: integration time-to-first-successful-agent-checkout, delegated-token fraud/chargeback rate vs. human baseline, webhook verification failure rate, and reconciliation break rate (zero-tolerance, borrowing the parity discipline from money-critical systems).

## 5. Tradeoffs and non-goals

- **Not a payment processor.** This proposes the trust and integration layer, not settlement. Money movement stays with a real PSP and is a human/PSP responsibility.
- **Client-first, spec-facing.** The SDK models the client integration surface against the emerging ACP spec. It deliberately does not stand up a backend.
- **Bet on standards, not on one vendor.** The design assumes ACP and UCP coexist and possibly converge; it avoids hard-coding either as the only path.
- **Honesty over hype.** No live users, no live checkout, no production claims. The value here is judgment and a correct trust model, not traction.

## 6. Roadmap - Now / Next / Later

**Now (in this repo)**
- ACP protocol notes and a delegated-payment security model write-up.
- ACP-vs-UCP comparison (structure in place; deep technical rows are roadmap).
- Design-stage ACP TypeScript client SDK: checkout sessions, delegated payment, HMAC webhook verification, typed errors, retries/idempotency - 35 passing unit tests.
- Published "Stage 1: Discovery" article for a merchant audience.

**Next**
- Finish the UCP overview and the ACP-vs-UCP technical rows (request/response, schema, transport bindings).
- A local mock ACP server so the SDK's checkout + delegation flows run end-to-end without a real backend.
- An eval/conformance harness for webhook verification and error mapping (see EVALS.md).
- A guardrail/policy module (per-agent limits, human-in-the-loop threshold, kill switch).

**Later**
- UCP client surface behind the same integration API; a protocol-adapter abstraction.
- Reconciliation and audit trail from agent intent to settled order.
- Real PSP integration and a reference merchant deployment (see FDE_JOURNEY.md).

---

*See ARCHITECTURE.md for the proposed reference architecture and diagrams, TECHNICAL_NOTES.md for the honest engineering scorecard and the ACP/UCP landscape, EVALS.md for the eval roadmap, and FDE_JOURNEY.md for how such infrastructure would deploy into a merchant/payment environment.*
