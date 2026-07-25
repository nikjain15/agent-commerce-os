# Architecture - Agent Commerce OS (proposed / reference)

**Read this as a reference architecture and a point of view, not a description of a running system.** Where a component actually exists in this repo, it is marked **[in repo]**. Everything else is **[proposed]**.

The repo contains a **design-stage ACP client SDK** (`demos/acp/acp-node`, ~2,100 lines TypeScript, 35 passing unit tests) plus protocol research (`notes/`, `comparisons/`, `articles/`). The SDK is a Stripe-patterned client: it models the *client-side integration surface* of the Agentic Commerce Protocol. It does not include a backend, and it targets a spec-facing host (`api.agentic-commerce.com`) rather than a live service.

---

## 1. The layers a real Agent Commerce OS would have

```mermaid
flowchart TB
    subgraph Buyer["Buyer + Agent"]
        U["End user"]
        A["AI agent (ChatGPT / Perplexity / custom)"]
    end

    subgraph OS["Agent Commerce OS  (the connective layer)"]
        SDK["Client SDK<br/>[in repo: acp-node]"]
        ADPT["Protocol adapters<br/>ACP [in repo] · UCP [proposed]"]
        POL["Policy + guardrails<br/>limits, HITL, kill switch [proposed]"]
        OBS["Observability<br/>request IDs, idempotency [in repo]<br/>reconciliation [proposed]"]
    end

    subgraph Rails["Merchant + Payment rails"]
        M["Merchant API / commerce platform"]
        PSP["Payment provider (Stripe / PSP)"]
        WH["Signed webhook events<br/>[verification in repo]"]
    end

    U -->|"delegates a bounded task"| A
    A --> SDK
    SDK --> ADPT
    ADPT --> POL
    POL --> M
    M --> PSP
    M -->|"HMAC-SHA256 signed"| WH
    WH -->|"constructEvent / verifySignature"| OBS
    OBS --> A
```

**What is real today:** the Client SDK, the ACP adapter surface, request IDs + idempotency in the HTTP client, and webhook signature verification. **What is proposed:** the UCP adapter, the policy/guardrail module, reconciliation, and every backend box (merchant API, PSP) - those are external systems the OS integrates with, not things this repo implements.

## 2. The reference SDK as built [in repo]

A Stripe-SDK-shaped client. Concrete files:

- `src/acp.ts` - `ACP` client: config parsing (api key / version / timeout / retries / host), resource wiring, static `errors` and `webhooks`.
- `src/resources/CheckoutSessions.ts` - `create`, `retrieve`, `update`, `complete`, `cancel`.
- `src/resources/DelegatePayment.ts` - `create` a scoped payment token.
- `src/Webhooks.ts` - `constructEvent`, `verifySignature`, `generateTestHeaderString`; HMAC-SHA256, timestamp tolerance (300s), timing-safe compare.
- `src/net/FetchHttpClient.ts` - fetch-based transport, exponential backoff with jitter, 429 `Retry-After` handling, abort/timeout, idempotency + `X-Request-Id` headers.
- `src/Error.ts` - `ACPError` base + 9 typed subclasses mapped from HTTP status.
- `src/types.ts` - request/response types for sessions, delegation, webhooks.

```mermaid
flowchart LR
    Client["ACP client"] --> CS["checkoutSessions"]
    Client --> DP["delegatePayment"]
    Client --> WHs["webhooks (static)"]
    CS --> RES["ACPResource._request"]
    DP --> RES
    RES --> HC["FetchHttpClient.makeRequest"]
    HC -->|"retry + backoff + idempotency"| API["ACP API host (spec-facing)"]
    HC --> ERR["ACPError.generate → typed error"]
    WHs --> CRYPTO["crypto HMAC-SHA256 + timingSafeEqual"]
```

## 3. Checkout-session flow (sequence)

The lifecycle the SDK is built around: `created -> payment_pending -> completed` (or `cancelled` / `expired`). Human approval is shown at the delegation step because authorizing money is a human decision.

```mermaid
sequenceDiagram
    participant User as End user
    participant Agent as AI agent
    participant SDK as ACP SDK [in repo]
    participant Merchant as Merchant API
    participant PSP as Payment provider

    User->>Agent: "Buy kids' sneakers under $50"
    Agent->>SDK: checkoutSessions.create(items, fulfillment)
    SDK->>Merchant: POST /v1/checkout_sessions
    Merchant-->>SDK: session { id, status: created, fulfillment options }
    SDK-->>Agent: CheckoutSession

    Agent->>SDK: checkoutSessions.update(id, selected shipping)
    SDK->>Merchant: POST /v1/checkout_sessions/{id}
    Merchant-->>SDK: session { status: payment_pending }

    Note over User,PSP: Payment authority is delegated, scoped, human-approved
    User->>SDK: approve delegated token (max $50, this merchant)
    SDK->>PSP: delegatePayment.create(payment_method, allowance)
    PSP-->>SDK: scoped token (spt_...)

    Agent->>SDK: checkoutSessions.complete(id, buyer, payment_data: token)
    SDK->>Merchant: POST /v1/checkout_sessions/{id}/complete
    Merchant->>PSP: charge within scope
    PSP-->>Merchant: authorized
    Merchant-->>SDK: session { status: completed, order }
    Merchant->>Agent: webhook checkout_session.completed (HMAC signed)
    Agent->>SDK: webhooks.constructEvent(body, sig, secret)
    SDK-->>Agent: verified event ✓
```

## 4. Delegated-token trust model

The core idea: **the agent never holds a raw credential; it holds a token scoped so tightly that misuse is bounded by construction.** Trust between the three strangers (buyer, merchant, PSP) is established by scope + signatures, not reputation.

```mermaid
flowchart TD
    subgraph Issue["Issuance (human-approved)"]
        CARD["Raw payment method<br/>(card / fpan)"]
        ALLOW["Allowance:<br/>reason=one_time<br/>max_amount=$50<br/>currency=usd<br/>merchant_id=acme"]
        CARD --> MINT
        ALLOW --> MINT["PSP mints scoped token spt_..."]
    end

    MINT -->|"token only, never the card"| AGENT["Agent holds spt_..."]

    subgraph Use["Use (bounded by construction)"]
        AGENT --> COMPLETE["checkoutSessions.complete(payment_data: spt_...)"]
        COMPLETE --> CHECK{"PSP enforces scope"}
        CHECK -->|"amount ≤ max<br/>merchant matches<br/>not expired<br/>reason valid"| OK["Charge authorized"]
        CHECK -->|"any check fails"| DENY["Rejected"]
    end

    OK -->|"HMAC-signed"| EVENT["Webhook: order.created / checkout_session.completed"]
    EVENT --> VERIFY["Merchant + agent verify signature<br/>timing-safe, ≤300s old"]

    style CARD fill:#ffd7d7,stroke:#c00
    style AGENT fill:#d7e8ff,stroke:#06c
    style DENY fill:#ffd7d7,stroke:#c00
    style OK fill:#d7ffd7,stroke:#0a0
```

**Five invariants the model enforces (from `notes/acp-overview.md` and the SDK):**
1. The agent never sees raw payment credentials.
2. Tokens are scoped to a specific merchant and purpose.
3. Tokens carry a max amount.
4. Tokens expire.
5. Events are HMAC-SHA256 signed and verified with a timestamp tolerance and timing-safe comparison.

**Honest limits of the current implementation:** scope *enforcement* lives on the (non-existent) PSP/backend side; the SDK provides the client surface to request and carry the token, and it provides real, tested verification of the returned signed events. Enforcement, revocation, and settlement are proposed, not built.

## 5. Where the boundaries are

| Concern | This repo | A real deployment |
|---|---|---|
| Client integration surface | **Built** (ACP) | + UCP adapter |
| Webhook verification | **Built + tested** | Same, plus replay/DLQ |
| Retries / idempotency | **Built** | Same |
| Scope enforcement / revocation | Modeled in docs | PSP + backend |
| Backend, settlement, ledger | None | Merchant + PSP |
| Policy / HITL / kill switch | Proposed | Required |
| Reconciliation / audit | Proposed | Zero-tolerance, like money-critical parity |
