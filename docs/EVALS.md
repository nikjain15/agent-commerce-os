# Evals - roadmap (what this WOULD need)

**This is a roadmap, not a description of an implemented eval suite.** Today the repo has **35 unit tests** on the reference SDK's security-sensitive plumbing (webhook signatures, error mapping, client construction) - real and passing, but unit tests, not evals. Because there is no model in the loop, most of the classic LLM-eval ladder (LLM-judge, model evals, A/B on generations) **does not apply to this repo directly** - it applies to the *agent* that would call this SDK. This doc separates the two.

---

## What exists today (verified)

- `demos/acp/acp-node`: `npm test` -> **35 passed**.
  - `Webhooks.spec.ts` (14): signature generation, verification, tolerance, tampering rejection.
  - `Error.spec.ts` (11): status -> typed-error mapping across the 9 error classes.
  - `acp.spec.ts` (10): client construction, config precedence, API version, static properties.

These are the right things to unit-test first: the security-critical code. But they are not evals.

## The ladder this repo should climb

**1. Unit tests (have some, expand)**
- Add: request construction (headers, auth, idempotency, backoff timing), session lifecycle transitions, delegated-token param validation.
- Metric: line/branch coverage on `src/` (target the security-sensitive files at ~100%).

**2. Conformance / contract tests against the ACP spec (roadmap - highest value)**
- A fixture set of spec-shaped request/response pairs; assert the client serializes requests and deserializes responses exactly per the ACP spec.
- Run the flows against a **local mock ACP server** (PRD.md roadmap) so `create -> update -> complete` and `delegatePayment.create` run end-to-end deterministically.
- Metrics: conformance pass rate; schema-diff count vs. spec.

**3. Security / adversarial evals (roadmap)**
- Webhook: replayed old timestamp, wrong secret, truncated signature, malformed header, multiple `v1` signatures - all must reject. Timing-safety check on the compare.
- Delegation: out-of-scope amount, wrong merchant, expired token, reused one-time token - all must be denied *once enforcement exists*.
- Metric: adversarial rejection rate = 100% (a single miss is a failure).

**4. The agent-side ladder (belongs to the agent, not this SDK - named for completeness)**
- **LLM-judge:** did the agent buy the right item within the user's constraint ("under $50, good reviews")? Judge grounded on the actual catalog, not vibes.
- **Grounding/precision-recall:** of items the agent proposed to buy, how many actually met the constraints (precision) and how many valid options did it miss (recall/F1).
- **A/B:** delegated-checkout completion rate, chargeback/fraud rate vs. human baseline, and reconciliation-break rate (zero-tolerance).

## Named metrics to target (if this became a product)

- Conformance pass rate vs. ACP spec: 100%.
- Adversarial webhook/delegation rejection rate: 100%.
- Double-charge rate under retry storms: 0 (idempotency).
- Reconciliation break rate (intent -> settled): 0.
- Agent purchase precision / recall / F1 against user constraints (agent-side).

## Honest status

| Layer | Status |
|---|---|
| SDK unit tests | **Implemented (35 passing)** |
| Spec conformance tests | Roadmap |
| Mock backend for end-to-end | Roadmap |
| Security/adversarial evals | Roadmap |
| Agent-side judge / grounding / A/B | Roadmap (and belongs to the calling agent) |
