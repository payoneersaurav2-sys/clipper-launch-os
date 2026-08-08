/* Development-only OpenRouter cost measurement harness. It is never imported by the product. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PromptEngine } from '../../packages/core/src/ai/prompt-engine';
import { operations, buildOperation, type Size } from './operations';

type AtomicCall = { requestId?: string; model: string; promptTokens?: number; completionTokens?: number; reasoningTokens?: number; totalTokens?: number; actualCostUsd?: number; latencyMs: number; success: boolean; error?: string; timestamp: string; retry: boolean };
type Measurement = { feature: string; operation: string; size: Size; model: string; success: boolean; structuredOutputValid: boolean; calls: AtomicCall[]; timestamp: string };
const root = resolve(import.meta.dirname, '../..');
const output = resolve(import.meta.dirname, 'output');
const HARD_MAX_REQUESTS = 500, HARD_MAX_SPEND = 50;
const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const flag = (name: string) => process.argv.includes(`--${name}`);
const positive = (value: string | undefined, fallback: number) => Math.max(1, Number(value) || fallback);
function envFile() { const p = resolve(root, '.env.ai-cost'); if (!existsSync(p)) return; for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) { const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ''); } }
function json(content: string) { try { JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); return true; } catch { return false; } }
function median(values: number[]) { const s = [...values].sort((a,b) => a-b); return s.length ? s[Math.floor(s.length / 2)] : undefined; }
function average(values: number[]) { return values.length ? values.reduce((a,b) => a+b, 0) / values.length : undefined; }
function dollars(v?: number) { return v === undefined ? 'not reported' : `$${v.toFixed(6)}`; }

const suite = (arg('suite') ?? 'smoke') as 'smoke' | 'baseline' | 'compare';
const runs = positive(arg('runs'), suite === 'smoke' ? 1 : 5);
const models = (arg('models') ?? 'openai/gpt-4o-mini').split(',').map(s => s.trim()).filter(Boolean);
const sizes: Size[] = suite === 'smoke' ? ['normal'] : ['small', 'normal', 'large'];
const plan = operations.flatMap(operation =>
  models.flatMap(model => sizes.flatMap(size =>
    Array.from({ length: runs }, () => ({ operation, model, size }))
  ))
);
// Baseline has 165 planned actions (11 operations × 3 sizes × 5 runs), each of
// which can use a second production-equivalent JSON retry. Leave enough room
// for the complete suite while retaining the absolute 500-call ceiling.
const maxRequests = Math.min(positive(arg('max-requests'), suite === 'smoke' ? 25 : 350), HARD_MAX_REQUESTS);
const maxSpend = Math.min(positive(arg('max-spend'), suite === 'smoke' ? 2 : 15), HARD_MAX_SPEND);

function printPlan() {
  console.log(`Creator OS AI cost analyzer — ${suite} plan (ZERO provider calls)`);
  console.table(operations.map(o => ({ feature: o.feature, operation: o.description, cases: sizes.join(', '), runs, models: models.join(', '), plannedActions: sizes.length * runs * models.length })));
  console.log(`Planned user operations: ${plan.length}. Atomic provider calls: ${plan.length} minimum, ${plan.length * 2} maximum (one production-equivalent JSON retry).`);
  console.log(`Run guard: ${maxRequests} atomic calls / $${maxSpend.toFixed(2)} reported spend. Absolute guard: ${HARD_MAX_REQUESTS} / $${HARD_MAX_SPEND}.`);
  console.log('No token or dollar estimate is displayed: real OpenRouter usage and cost will be captured only after a confirmed run. A single provider response can exceed the remaining cap.');
  console.log('To measure: npm run ai-cost -- --run --suite=' + suite + ' --confirm --max-requests=' + maxRequests + ' --max-spend=' + maxSpend);
}

async function request(model: string, context: ReturnType<typeof buildOperation>['context'], retry = false): Promise<{ call: AtomicCall; content: string }> {
  const built = PromptEngine.build(PromptEngine.compress(context));
  const messages = retry ? [...built.messages, { role: 'user' as const, content: 'Return the requested result as one valid JSON object only. Do not use markdown fences or explanatory text.' }] : built.messages;
  const started = Date.now();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost/creator-os-cost-lab', 'X-Title': 'Creator OS Local Cost Analyzer' }, body: JSON.stringify({ model, messages, temperature: built.temperature, max_tokens: context.maxTokens, response_format: context.expectedJsonSchema ? { type: 'json_schema', json_schema: { name: 'creator_os_response', strict: false, schema: context.expectedJsonSchema } } : undefined, plugins: context.expectedJsonSchema ? [{ id: 'response-healing' }] : undefined, usage: { include: true } }) });
    const payload = await response.json().catch(() => ({})); const usage = payload.usage ?? {};
    const call: AtomicCall = { requestId: payload.id, model, promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? usage.reasoning_tokens, totalTokens: usage.total_tokens, actualCostUsd: typeof usage.cost === 'number' ? usage.cost : undefined, latencyMs: Date.now() - started, success: response.ok, error: response.ok ? undefined : (payload.error?.message ?? JSON.stringify(payload.error ?? payload)), timestamp: new Date().toISOString(), retry };
    return { call, content: payload.choices?.[0]?.message?.content ?? '' };
  } catch (error) { return { call: { model, latencyMs: Date.now() - started, success: false, error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString(), retry }, content: '' }; }
}

function report(measurements: Measurement[]) {
  const all = measurements.flatMap(m => m.calls); const groups = new Map<string, Measurement[]>();
  for (const m of measurements) { const key = `${m.feature} | ${m.operation} | ${m.model}`; groups.set(key, [...(groups.get(key) ?? []), m]); }
  const rows = [...groups].map(([key, ms]) => { const calls = ms.flatMap(m => m.calls); const costs = calls.map(c => c.actualCostUsd).filter((v): v is number => v !== undefined); const latencies = calls.map(c => c.latencyMs); const p95 = [...costs].sort((a,b)=>a-b)[Math.max(0, Math.ceil(costs.length*.95)-1)]; return { operation: key, actions: ms.length, calls: calls.length, avgCost: dollars(average(costs)), p95Cost: dollars(p95), avgLatencyMs: Math.round(average(latencies) ?? 0), failureRate: `${((calls.filter(c=>!c.success).length / Math.max(1,calls.length))*100).toFixed(1)}%` }; });
  const totalCost = all.reduce((n, c) => n + (c.actualCostUsd ?? 0), 0); const missingCosts = all.filter(c => c.actualCostUsd === undefined).length;
  const markdown = `# Creator OS AI Cost Report\n\nGenerated: ${new Date().toISOString()}\n\n## Measurement status\n\n- User operations: ${measurements.length}\n- Atomic OpenRouter calls: ${all.length}\n- Reported OpenRouter spend: ${dollars(totalCost)}${missingCosts ? ` (${missingCosts} calls did not return a cost)` : ''}\n- Success rate: ${(((all.filter(c=>c.success).length / Math.max(1,all.length))*100).toFixed(1))}%\n\n## Cost profile\n\n| Feature / operation / model | Actions | Calls | Avg cost | P95 cost | Avg latency | Failure rate |\n|---|---:|---:|---:|---:|---:|---:|\n${rows.map(r=>`| ${r.operation} | ${r.actions} | ${r.calls} | ${r.avgCost} | ${r.p95Cost} | ${r.avgLatencyMs} ms | ${r.failureRate} |`).join('\n')}\n\n## Packaging model (assumptions, not production pricing)\n\nNo price or credit allowance is recommended until costs exist for the relevant operations. For any chosen plan price, revenue required at a target margin is **AI cost / (1 - target margin)**. The local dashboard uses 50%, 60%, 70%, and 80% scenarios after measurements.\n\nRecommended next action: run baseline measurements, inspect output quality manually, then enter intended plan prices to calculate safe allowances and credit-pack economics.\n`;
  mkdirSync(output, { recursive: true }); writeFileSync(resolve(output, 'AI-COST-DATA.json'), JSON.stringify({ generatedAt: new Date().toISOString(), measurements }, null, 2)); writeFileSync(resolve(output, 'AI-COST-REPORT.md'), markdown);
  writeFileSync(resolve(output, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Creator OS AI Cost Lab</title><style>body{font:16px system-ui;background:#09090b;color:#eee;padding:28px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #303036;padding:10px;text-align:left}th{color:#a855f7}</style><h1>Creator OS AI Cost Lab</h1><p>Reported spend: ${dollars(totalCost)} · ${measurements.length} operations · ${all.length} provider calls</p><table><tr><th>Operation</th><th>Actions</th><th>Calls</th><th>Average cost</th><th>P95</th><th>Latency</th></tr>${rows.map(r=>`<tr><td>${r.operation}</td><td>${r.actions}</td><td>${r.calls}</td><td>${r.avgCost}</td><td>${r.p95Cost}</td><td>${r.avgLatencyMs} ms</td></tr>`).join('')}</table>`);
  console.table(rows); console.log(`Saved local results to ${output}`);
}

async function run() {
  envFile(); if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required in the local .env.ai-cost file or environment.');
  let spend = 0, used = 0; const measurements: Measurement[] = [];
  for (const item of plan) {
    if (used >= maxRequests || spend >= maxSpend) { console.log('Safety guard reached; stopping before the next provider call.'); break; }
    const { context } = buildOperation(item.operation, item.size, item.model); const first = await request(item.model, context); used++;
    let calls = [first.call]; let valid = !context.expectedJsonSchema || json(first.content);
    if (first.call.actualCostUsd !== undefined) spend += first.call.actualCostUsd;
    if (first.call.success && context.expectedJsonSchema && !valid && used < maxRequests && spend < maxSpend) { const retry = await request(item.model, context, true); calls.push(retry.call); used++; valid = json(retry.content); if (retry.call.actualCostUsd !== undefined) spend += retry.call.actualCostUsd; }
    measurements.push({ feature: item.operation.feature, operation: item.operation.description, size: item.size, model: item.model, success: calls.every(c=>c.success) && valid, structuredOutputValid: valid, calls, timestamp: new Date().toISOString() });
    console.log(`${used}/${maxRequests}: ${item.operation.feature} / ${item.operation.description} / ${item.size} — ${dollars(calls.reduce((n,c)=>n+(c.actualCostUsd??0),0))}`);
  }
  report(measurements);
}

if (!flag('run')) printPlan();
else if (!flag('confirm')) { console.error('Refusing to call OpenRouter without --confirm. Run --plan first.'); process.exitCode = 2; }
else run().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
