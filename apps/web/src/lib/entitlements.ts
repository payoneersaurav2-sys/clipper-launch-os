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
  knowledge_items_limit: number;
  prompt_limit: number;
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
 *   free    — core tools are enabled, but analytics, knowledge vault, and prompt library require an upgrade
 *   creator — analytics unlocks here, plus up to 2 knowledge resources and 5 saved prompts per workspace
 *   pro     — up to 10 knowledge resources and 10 saved prompts per workspace
 *   agency  — unlimited knowledge resources and prompts
 */
export const planEntitlements: Record<PlanTier, { capabilities: PlanCapabilities; limits: PlanLimits }> = {
  free: {
    capabilities: {
      core_ai: true,
      campaigns: true,
      clip_pipeline: true,
      basic_analytics: false,
      scheduling: true,
      batch_generation: false,
      multi_workspace: false,
      knowledge_vault: false,
      prompt_library: false,
    },
    limits: {
      workspaces: 1,
      active_campaigns: 10,
      ai_generations_per_month: 0,
      content_batch_size: 5,
      max_output_tokens: 4000,
      knowledge_items_limit: 0,
      prompt_limit: 0,
    },
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
    limits: {
      workspaces: 3,
      active_campaigns: 50,
      ai_generations_per_month: 250,
      content_batch_size: 30,
      max_output_tokens: 4000,
      knowledge_items_limit: 2,
      prompt_limit: 5,
    },
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
    limits: {
      workspaces: 10,
      active_campaigns: 250,
      ai_generations_per_month: 1000,
      content_batch_size: 50,
      max_output_tokens: 8000,
      knowledge_items_limit: 10,
      prompt_limit: 10,
    },
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
    limits: {
      workspaces: 10,
      active_campaigns: 250,
      ai_generations_per_month: 3000,
      content_batch_size: 50,
      max_output_tokens: 8000,
      knowledge_items_limit: -1,
      prompt_limit: -1,
    },
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

function normalizeCapability(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  return normalizeBoolean(value);
}

export function normalizeCapabilities(capabilities: unknown, fallback: PlanCapabilities): PlanCapabilities | null {
  if (capabilities === null || capabilities === undefined) return null;
  if (typeof capabilities !== 'object') return null;
  const raw = capabilities as Record<string, unknown>;
  return {
    core_ai: normalizeCapability(raw.core_ai, fallback.core_ai),
    campaigns: normalizeCapability(raw.campaigns, fallback.campaigns),
    clip_pipeline: normalizeCapability(raw.clip_pipeline, fallback.clip_pipeline),
    basic_analytics: normalizeCapability(raw.basic_analytics, fallback.basic_analytics),
    scheduling: normalizeCapability(raw.scheduling, fallback.scheduling),
    batch_generation: normalizeCapability(raw.batch_generation, fallback.batch_generation),
    multi_workspace: normalizeCapability(raw.multi_workspace, fallback.multi_workspace),
    knowledge_vault: normalizeCapability(raw.knowledge_vault, fallback.knowledge_vault),
    prompt_library: normalizeCapability(raw.prompt_library, fallback.prompt_library),
  };
}

export function normalizeLimits(limits: unknown, fallback: PlanLimits): PlanLimits | null {
  if (limits === null || limits === undefined) return null;
  if (typeof limits !== 'object') return null;
  const raw = limits as Record<string, unknown>;
  return {
    workspaces: Number(raw.workspaces ?? fallback.workspaces),
    active_campaigns: Number(raw.active_campaigns ?? fallback.active_campaigns),
    ai_generations_per_month: Number(raw.ai_generations_per_month ?? fallback.ai_generations_per_month),
    content_batch_size: Number(raw.content_batch_size ?? fallback.content_batch_size),
    max_output_tokens: Number(raw.max_output_tokens ?? fallback.max_output_tokens),
    knowledge_items_limit: Number(raw.knowledge_items_limit ?? raw.knowledge_limit ?? fallback.knowledge_items_limit),
    prompt_limit: Number(raw.prompt_limit ?? raw.prompts_limit ?? fallback.prompt_limit),
  };
}

export function hasUnlimitedLimit(limit: number | undefined): boolean {
  return typeof limit === 'number' && limit < 0;
}

export function getKnowledgeLimitForTier(tier: PlanTier | null | undefined): number {
  if (!tier) return 0;
  return planEntitlements[tier].limits.knowledge_items_limit;
}

export function getPromptLimitForTier(tier: PlanTier | null | undefined): number {
  if (!tier) return 0;
  return planEntitlements[tier].limits.prompt_limit;
}

export function isFeatureUnlockedForTier(tier: PlanTier | null | undefined, feature: 'knowledge_vault' | 'prompt_library'): boolean {
  const currentTier = tier ?? 'free';
  if (feature === 'knowledge_vault') {
    return currentTier === 'creator' || currentTier === 'pro' || currentTier === 'agency';
  }
  return currentTier === 'creator' || currentTier === 'pro' || currentTier === 'agency';
}

export function getTierUpgradeMessage(tier: PlanTier | null | undefined, feature: 'knowledge_vault' | 'prompt_library'): string {
  switch (feature) {
    case 'knowledge_vault':
      if (!tier || tier === 'free') return 'Free includes no Knowledge Vault access. Upgrade to Creator for 2 knowledge items, Pro for 10, or Agency for unlimited.';
      if (tier === 'creator') return 'Creator includes 2 knowledge items. Upgrade to Pro for 10 or Agency for unlimited.';
      if (tier === 'pro') return 'Pro includes 10 knowledge items. Upgrade to Agency for unlimited.';
      return 'Agency includes unlimited knowledge items.';
    case 'prompt_library':
      if (!tier || tier === 'free') return 'Free includes no saved prompt access. Upgrade to Creator for 5 prompts, Pro for 10, or Agency for unlimited.';
      if (tier === 'creator') return 'Creator includes 5 saved prompts. Upgrade to Pro for 10 or Agency for unlimited.';
      if (tier === 'pro') return 'Pro includes 10 saved prompts. Upgrade to Agency for unlimited.';
      return 'Agency includes unlimited saved prompts.';
    default:
      return 'Upgrade your plan to unlock this feature.';
  }
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
