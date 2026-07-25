# Agent Commerce OS

**A point of view - and a reference architecture - for how AI agents will buy on your behalf.**

[![ACP reference SDK](https://img.shields.io/badge/ACP_reference_SDK-v0.1.0-blue)](demos/acp/acp-node)
[![tests](https://img.shields.io/badge/tests-35_passing-brightgreen)](demos/acp/acp-node/test)
[![status](https://img.shields.io/badge/status-research_%2B_design--stage-orange)](docs/)

This repo is a **research / thesis artifact** on agentic commerce - the emerging standards (ACP, UCP), the delegated-payment trust model, and what a real "Agent Commerce OS" would have to do - backed by a **design-stage reference SDK** that implements the client side of the Agentic Commerce Protocol.

> **What this is, plainly:** protocol research + a proposed reference architecture + a working, unit-tested reference client. **What it is not:** a shipping product. There is no live backend, no live checkout, and no production users. Everything is marked "in repo" or "proposed." See [docs/TECHNICAL_NOTES.md](docs/TECHNICAL_NOTES.md) for the honest scorecard.

## The thesis

As agents (ChatGPT, Perplexity, custom assistants) start *completing* purchases rather than just recommending them, commerce needs a thin, boring, verifiable trust layer: **scoped payment delegation, session-based checkout, and signed events** - so a merchant, an agent, and a payment provider can transact without trusting each other. Two standards are forming (ACP, payment-first; UCP, broader interop), and merchants should not have to bet the store on one. Full argument in [docs/PRD.md](docs/PRD.md).

## Docs

| Doc | What's in it |
|---|---|
| [PRD.md](docs/PRD.md) | The product thesis: problem, personas (merchant / agent dev / PSP / buyer), JTBD, what a real Agent Commerce OS needs, metrics, Now/Next/Later. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Proposed reference architecture with Mermaid diagrams: layer map, checkout-session sequence, and the delegated-token trust model. Marked "in repo" vs "proposed." |
| [TECHNICAL_NOTES.md](docs/TECHNICAL_NOTES.md) | Honest 12-point rubric scorecard (most engineering dims = design-stage; AI dims N/A), plus the ACP/UCP landscape summarized from the notes. |
| [FDE_JOURNEY.md](docs/FDE_JOURNEY.md) | How such infrastructure would deploy into a merchant / payment environment: secrets, shadow -> pilot -> cutover, observability, de-risking. |
| [EVALS.md](docs/EVALS.md) | Roadmap: what evals this would need (unit -> spec conformance -> adversarial -> agent-side judge/grounding/A/B). Clearly roadmap. |

## What's in the repo today

- **`demos/acp/acp-node/`** - a **design-stage reference SDK** for ACP (~2,100 lines TypeScript, **35 passing unit tests**). Stripe-patterned client:
  - Checkout Sessions (create / retrieve / update / complete / cancel)
  - Delegate Payment (scoped payment tokens - max amount, merchant, expiry)
  - Webhook signature verification (HMAC-SHA256, timing-safe, timestamp tolerance)
  - Typed error taxonomy (9 error classes), retries with backoff, idempotency keys, dual CJS/ESM
  - It models the **client integration surface** against the emerging ACP spec. It targets a spec-facing host and does **not** include a backend or live payment integration.
- **`notes/`** - ACP overview (delegated-payment security model) and a UCP overview (work in progress).
- **`comparisons/`** - ACP vs UCP (structure in place; deep technical rows are roadmap).
- **`articles/`** - "AI Agents Are Learning to Shop" (Stage 1: Discovery), a merchant-facing piece.
- **`resources.md`** - ACP / UCP / AP2 / A2A / MCP references.

```typescript
import ACP from 'acp-node';

const acp = new ACP('sk_test_...');

// Create a checkout session an agent can drive
const session = await acp.checkoutSessions.create({
  items: [{ id: 'item_123', quantity: 1 }],
  fulfillment_details: { name: 'John Doe', email: 'john@example.com', address: { /* ... */ } },
});

// Mint a scoped, human-approved payment token - the agent never sees the card
const token = await acp.delegatePayment.create({
  payment_method: { type: 'card', /* ... */ },
  allowance: { reason: 'one_time', max_amount: 5000, currency: 'usd', merchant_id: 'acme_store' },
});
```

**[→ Reference SDK details](demos/acp/acp-node/README.md)**

## Protocols covered

| Protocol | Steward | Focus | In this repo |
|---|---|---|---|
| [ACP](https://agenticcommerce.dev) | OpenAI + Stripe | Payment delegation + checkout for agents | Notes + design-stage reference SDK |
| [UCP](https://ucp.dev) | Broader consortium *(verify)* | Full commerce interoperability | Notes (WIP) + comparison |

## Roadmap

- [x] ACP deep dive + delegated-payment trust model
- [x] ACP reference client SDK (checkout, delegation, webhooks) - 35 tests
- [ ] Finish UCP overview + ACP-vs-UCP technical comparison
- [ ] Local mock ACP server for end-to-end flows
- [ ] Spec-conformance + adversarial eval harness ([EVALS.md](docs/EVALS.md))
- [ ] Guardrail / policy module (limits, human-in-the-loop, kill switch)

## Writing

More context and analysis at [founderfirst.one](https://founderfirst.one).
- [AI Agents Are Learning to Shop](articles/ai-agents-learning-to-shop.md) - Stage 1: Discovery

---

<p align="center">
  <a href="https://founderfirst.one">FounderFirst</a> ·
  <a href="https://founderfirstone.substack.com">Newsletter</a> ·
  <a href="https://github.com/nikjain15">@nikjain15</a>
</p>
