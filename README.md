# Agentic Commerce Sandbox

Learning, experimenting, and building with agentic commerce protocols.

[![ACP SDK](https://img.shields.io/badge/ACP_SDK-v0.1.0-blue)](demos/acp/acp-node)
[![FounderFirst](https://img.shields.io/badge/FounderFirst-Newsletter-orange)](https://founderfirstone.substack.com)

## What's Here

- **notes/** - Protocol overviews and technical deep-dives
- **comparisons/** - How ACP and UCP differ and overlap
- **demos/** - **Working SDKs and examples**
- **articles/** - Published content about agentic commerce

## 🚀 Featured: ACP TypeScript SDK

A production-ready TypeScript SDK for the Agentic Commerce Protocol:

```typescript
import ACP from 'acp-node';

const acp = new ACP('acp_live_xxx');

// Create checkout session for AI agent
const session = await acp.checkoutSessions.create({
  merchant_id: 'merch_123',
  agent_id: 'agent_456',
  line_items: [{ name: 'Product', quantity: 1, unit_price: { amount: 2999, currency: 'USD' } }]
});
```

**[→ View SDK Documentation](demos/acp/acp-node/README.md)**

### SDK Features
- ✅ Checkout Sessions API (create, retrieve, update, complete, cancel)
- ✅ Delegate Payment API for scoped payment tokens
- ✅ Webhook signature verification (timing-safe)
- ✅ Comprehensive error handling (9 error types)
- ✅ Dual CJS/ESM builds
- ✅ Full TypeScript support
- ✅ 35 tests passing

## Protocols Covered

| Protocol | Led By | Focus | Status |
|----------|--------|-------|--------|
| [ACP](https://agenticcommerce.dev) | OpenAI + Stripe | Payment & checkout for AI agents | **SDK Ready** ✅ |
| [UCP](https://ucp.dev) | Shopify + Google + Walmart | Full commerce interoperability | Coming Soon |

## Why This Exists

AI agents are starting to shop autonomously. Two major protocols are emerging to standardize how this works:

- **ACP** focuses on secure payment delegation and checkout flows
- **UCP** focuses on broader commerce interoperability across platforms

I'm building tools and documenting learnings to help merchants and developers adopt these protocols.

## Writing

More context and analysis at [founderfirst.one](https://founderfirst.one)

- [AI Agents Are Learning to Shop](articles/ai-agents-learning-to-shop.md) - Stage 1: Discovery

## Structure

```
├── notes/
│   ├── acp-overview.md
│   └── ucp-overview.md
├── comparisons/
│   └── acp-vs-ucp.md
├── demos/
│   ├── acp/
│   │   └── acp-node/          ← TypeScript SDK
│   │       ├── src/           ← Source code
│   │       ├── test/          ← Test suite
│   │       └── examples/      ← Integration examples
│   └── ucp/
├── articles/
│   └── ai-agents-learning-to-shop.md
└── resources.md
```

## Progress

- [x] ACP deep dive
- [x] **ACP TypeScript SDK** (demos/acp/acp-node)
- [ ] UCP deep dive
- [ ] UCP SDK
- [ ] Technical comparison article
- [ ] End-to-end demo with real checkout

---

<p align="center">
  <a href="https://founderfirst.one">FounderFirst</a> ·
  <a href="https://founderfirstone.substack.com">Newsletter</a> ·
  <a href="https://github.com/nikjain15">@nikjain15</a>
</p>
