# Creator OS local AI cost analyzer

This development tool measures real OpenRouter usage for Creator OS prompts. It is not bundled into the web app and must never be deployed.

## Safe workflow

1. Copy `.env.ai-cost.example` to a local, untracked `.env.ai-cost` and set `OPENROUTER_API_KEY`.
2. Run `npm run ai-cost -- --plan --suite=smoke`. This performs **zero API calls**.
3. Review its exact operation/call count and exposure cap.
4. Only then run `npm run ai-cost -- --run --suite=smoke --confirm --max-requests=25 --max-spend=2`.

The tool stops before starting a call when the request cap is reached and stops after each response if cumulative **reported** OpenRouter cost reaches the spend cap. A provider response can exceed the remaining cap, so treat the cap as an exposure guard, not a billing guarantee. The hard limits are 500 requests and $50 per invocation.

Suites: `smoke` (one normal case per feature), `baseline` (small/normal/large, default five runs), and `compare` (selected models). Add `--runs=N`, `--models=model-a,model-b`, or `--max-requests=N` explicitly.

Results are generated locally under `dev/ai-cost-analyzer/output/`:

- `AI-COST-DATA.json` — atomic provider measurements and operation outcomes.
- `AI-COST-REPORT.md` — aggregate costs, P95, customer/package simulations, and recommendations.
- `index.html` — local visual dashboard.

Costs are only reported if OpenRouter returns them. The tool deliberately does not estimate token counts or fabricate missing provider costs.
