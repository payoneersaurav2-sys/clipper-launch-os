export type PlanTier = 'free' | 'creator' | 'pro' | 'agency';
export type EntitlementStatus = 'active' | 'unsubscribed' | 'unknown';
export type EntitlementFeature =
  | 'core_ai'
  | 'campaigns'
  | 'clip_pipeline'
  | 'basic_analytics'
  | 'scheduling'
  | 'batch_generation'
  | 'multi_workspace'
  | 'knowledge_vault'
  | 'prompt_library';

export type PlanCapabilities = Record<EntitlementFeature, boolean>;

export type PlanLimits = {
  workspaces: number;
  active_campaigns: number;
  ai_generations_per_month: number;
  content_batch_size: number;
  max_output_tokens: number;
};

export type Entitlements = {
  status: EntitlementStatus;
  tier?: PlanTier;
  capabilities?: PlanCapabilities;
  limits?: PlanLimits;
  membershipExpiresAt?: string | null;
};

/**
 * Client-side mirror for rendering and helpful upgrade guidance only.
 * The database migration is authoritative for every enforceable limit.
 *
 * Tier summary:
 *   free    — all core tools, 1 workspace, 10 active campaigns
 *   creator — 3 workspaces, 50 active campaigns, 30-item batches
 *   pro     — 10 workspaces, 250 active campaigns, 50-item batches
 *   agency  — same capacity as pro, higher monthly credit allowance
 */
export const planEntitlements: Record<PlanTier, { capabilities: PlanCapabilities; limits: PlanLimits }> = {
  free: {
    capabilities: {
      core_ai: true,
      campaigns: true,
      clip_pipeline: true,
      basic_analytics: true,
      scheduling: true,
      batch_generation: false,
      multi_workspace: false,
      knowledge_vault: false,
      prompt_library: false,
    },
    limits: { workspaces: 1, active_campaigns: 10, ai_generations_per_month: 0, content_batch_size: 5, max_output_tokens: 4000 },
  },
  creator: {
    capabilities: {
      core_ai: true,
      campaigns: true,
      clip_pipeline: true,
      basic_analytics: true,
      scheduling: true,
      batch_generation: true,
      multi_workspace: true,
      knowledge_vault: true,
      prompt_library: true,
    },
    limits: { workspaces: 3, active_campaigns: 50, ai_generations_per_month: 250, content_batch_size: 30, max_output_tokens: 4000 },
  },
  pro: {
    capabilities: {
      core_ai: true,
      campaigns: true,
      clip_pipeline: true,
      basic_analytics: true,
      scheduling: true,
      batch_generation: true,
      multi_workspace: true,
      knowledge_vault: true,
      prompt_library: true,
    },
    limits: { workspaces: 10, active_campaigns: 250, ai_generations_per_month: 1000, content_batch_size: 50, max_output_tokens: 8000 },
  },
  agency: {
    capabilities: {
      core_ai: true,
      campaigns: true,
      clip_pipeline: true,
      basic_analytics: true,
      scheduling: true,
      batch_generation: true,
      multi_workspace: true,
      knowledge_vault: true,
      prompt_library: true,
    },
    limits: { workspaces: 10, active_campaigns: 250, ai_generations_per_month: 3000, content_batch_size: 50, max_output_tokens: 8000 },
  },
};

export function normalizePlanTier(value: unknown): PlanTier | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'free' || normalized === 'creator' || normalized === 'pro' || normalized === 'agency') {
    return normalized;
  }
  return undefined;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function normalizeCapabilities(capabilities: unknown): PlanCapabilities | null {
  if (!capabilities || typeof capabilities !== 'object') return null;
  const raw = capabilities as Record<string, unknown>;
  return {
    core_ai: normalizeBoolean(raw.core_ai),
    campaigns: normalizeBoolean(raw.campaigns),
    clip_pipeline: normalizeBoolean(raw.clip_pipeline),
    basic_analytics: normalizeBoolean(raw.basic_analytics),
    scheduling: normalizeBoolean(raw.scheduling),
    batch_generation: normalizeBoolean(raw.batch_generation),
    multi_workspace: normalizeBoolean(raw.multi_workspace),
    knowledge_vault: normalizeBoolean(raw.knowledge_vault),
    prompt_library: normalizeBoolean(raw.prompt_library),
  };
}

export function normalizeLimits(limits: unknown): PlanLimits | null {
  if (!limits || typeof limits !== 'object') return null;
  const raw = limits as Record<string, unknown>;
  return {
    workspaces: Number(raw.workspaces ?? 0),
    active_campaigns: Number(raw.active_campaigns ?? 0),
    ai_generations_per_month: Number(raw.ai_generations_per_month ?? 0),
    content_batch_size: Number(raw.content_batch_size ?? 0),
    max_output_tokens: Number(raw.max_output_tokens ?? 0),
  };
}

export function isPlanTier(value: unknown): value is PlanTier {
  return normalizePlanTier(value) !== undefined;
}

export function hasEntitlement(
  entitlements: Entitlements | null | undefined,
  feature: EntitlementFeature,
) {
  return entitlements?.status === 'active' && normalizeBoolean(entitlements.capabilities?.[feature]);
}

export function requiredPlanFor(feature: EntitlementFeature): PlanTier {
  // batch_generation and multi_workspace unlock at creator tier (not pro).
  if (feature === 'batch_generation' || feature === 'multi_workspace') return 'creator';
  return 'creator';
}
