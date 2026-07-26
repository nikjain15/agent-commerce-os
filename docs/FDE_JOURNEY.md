# FDE Journey, deploying agentic-commerce infrastructure into a merchant / payment environment

**Framing:** this is how an Agent Commerce OS *would* deploy into a customer's live environment. Nothing here has been deployed, there is no live backend and no customer. It is written as a forward-deployed engineer's plan, because that is the point of the artifact: to show the deployment thinking, not to claim a rollout happened.

The through-line is the same discipline used on money-critical migrations: **an agent buying on someone's behalf is money movement, so it gets parity-grade rigor, shadow first, prove it, then cut over, and never let a probabilistic component authorize a charge.**

---

## 1. Who the customer is, and the integration surface

Two deployment shapes:

- **Merchant / commerce platform** wants to become "agent-buyable." Integration point: expose ACP-compatible checkout-session and delegated-payment endpoints (or sit behind an OS that translates to them), and emit signed webhooks. The reference SDK (`demos/acp/acp-node`) is what an agent developer would import to talk to that surface.
- **Payment provider / PSP** wants to issue and enforce scoped delegation tokens for non-human actors. Integration point: token minting with an allowance (max amount, currency, merchant, reason, expiry) and scope enforcement at authorization time.

The OS sits between the agent and these systems. What the repo provides today is the **client edge** of that surface (typed resources, retries, idempotency, signed-event verification). The backend, settlement, and enforcement are the customer's systems or roadmap.

## 2. Security and secrets

- **API keys:** `ACP_API_KEY` read from env, never hard-coded; bearer auth in `net/FetchHttpClient.ts`. Standard secret-manager injection at deploy time.
- **No raw credentials to the agent:** the entire delegated-token model exists so the agent holds `spt_...`, never a card. This is the single most important security property to preserve in any deployment.
- **Webhook signing secret:** HMAC-SHA256 verification (`Webhooks.constructEvent`) with 300s timestamp tolerance and timing-safe compare, to stop replay and forgery. The signing secret is a separate secret from the API key.
- **Idempotency:** `Idempotency-Key` header support prevents double-charges on retry, essential when a resilient client retries a `complete` call.
- **Scope enforcement is server-side:** a deployment must enforce token scope at the PSP/backend, not trust the client. The client cannot be the enforcement point.

## 3. Rollout / cutover plan (proposed)

1. **Sandbox / mock backend.** Stand up a mock ACP server (roadmap in PRD.md) so checkout + delegation flows run end-to-end with test cards, zero real money.
2. **Shadow mode.** Route real agent traffic through the OS in read/observe mode, create sessions, verify webhooks, log what a charge *would* be, without authorizing money. Compare against the merchant's existing checkout.
3. **Bounded pilot.** Enable real charges only with tight caps: low per-token `max_amount`, one-time `reason`, single merchant, short expiry, and a human-in-the-loop approval above a threshold. Small cohort of agents.
4. **Progressive limits.** Raise caps and widen the agent/merchant set as fraud, chargeback, and webhook-verification-failure metrics stay green.
5. **Cutover.** Make the agent path a first-class checkout channel, with a **kill switch** to disable delegated payment instantly and fall back to human checkout.

Cutover gates borrow the money-critical parity playbook: reconciliation clean, security sign-off, rollback ready, upstream/downstream (merchant + PSP) tested and notified.

## 4. Observability

- **Request IDs:** every request carries `X-Request-Id` (`net/FetchHttpClient.ts`); surface it in logs on both sides for tracing.
- **Webhook health:** track verification failure rate, signature-age rejections, and duplicate deliveries; a spike is a security signal.
- **Delegation metrics:** tokens minted, scope-denied attempts, expiry hits, per-agent spend vs. limit.
- **Reconciliation:** agent intent -> session -> completed order -> settled charge should reconcile to the cent, zero tolerance. This is the metric that decides whether the channel is trustworthy.

## 5. De-risking

| Risk | Mitigation |
|---|---|
| Agent authorizes something the user didn't want | Scoped tokens (amount/merchant/expiry) + human-in-the-loop above threshold; agent never holds raw credentials. |
| Forged / replayed webhook | HMAC-SHA256 + timestamp tolerance + timing-safe compare (implemented). |
| Double charge on retry | Idempotency keys (implemented). |
| Betting on the wrong protocol | Protocol-adapter surface so ACP today, UCP later, without a merchant rewrite (proposed). |
| Backend / PSP outage | Client retries with backoff + 429 handling; kill switch to human checkout. |
| Overclaiming readiness | This doc, PRD, and TECHNICAL_NOTES all state plainly what is built vs. proposed. |

## 6. What is genuinely deploy-ready vs. not

- **Deploy-ready (client edge):** typed ACP client operations, webhook verification, retry/idempotency resilience, error taxonomy, all unit-tested.
- **Not built:** the backend, PSP integration, scope enforcement, revocation, policy/guardrail module, reconciliation, and any UCP support. A real FDE engagement would start by standing up the mock backend and shadow mode above.
