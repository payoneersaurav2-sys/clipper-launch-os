import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCampaigns, Campaign, CampaignStatus } from "@/hooks/useCampaigns";
import { useWorkspacePrompts, useWorkspaceKnowledge } from "@/hooks/useWorkflowResources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandedDateField } from "@/components/BrandedDateControls";
import { Link } from "react-router-dom";
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Copy,
  Trash2,
  Archive,
  Pencil,
  Rocket,
  Target,
  X,
  ChevronDown,
} from "lucide-react";

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bg: string }
> = {
  researching: {
    label: "Researching",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
  planning: {
    label: "Planning",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
  },
  recording: {
    label: "Recording",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
  },
  editing: {
    label: "Editing",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
  },
  posting: {
    label: "Posting",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  growing: {
    label: "Growing",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  archived: {
    label: "Archived",
    color: "text-[#71717A]",
    bg: "bg-white/[0.04] border-white/[0.06]",
  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as CampaignStatus[];
const PLATFORMS = ["tiktok", "youtube", "instagram", "twitter", "universal"];
const FREQUENCY_UNITS = ["week", "day", "month"] as const;

function parsePostingFrequency(value?: string) {
  const match = value?.match(/^(\d+)\s*(?:per\s*)?(week|day|month)s?$/i);
  return {
    count: match?.[1] ?? "",
    unit: (match?.[2]?.toLowerCase() ??
      "week") as (typeof FREQUENCY_UNITS)[number],
  };
}

// ---- Create Modal -------------------------------------------
function CampaignModal({
  campaign,
  onClose,
}: {
  campaign?: Campaign;
  onClose: () => void;
}) {
  const { createCampaign, updateCampaign } = useCampaigns();
  const [form, setForm] = useState({
    title: campaign?.title ?? "",
    brand: campaign?.brand ?? "",
    niche: campaign?.niche ?? "",
    platform: campaign?.platform ?? "tiktok",
    goal: campaign?.goal ?? "",
    objective: campaign?.objective ?? "",
    target_audience: campaign?.target_audience ?? "",
    content_pillars: (campaign?.content_pillars ?? []).join(", "),
    posting_frequency: campaign?.posting_frequency ?? "",
    start_date: campaign?.start_date?.slice(0, 10) ?? "",
    end_date: campaign?.end_date?.slice(0, 10) ?? "",
    status: campaign?.status ?? ("planning" as CampaignStatus),
  });
  const [frequencyCount, setFrequencyCount] = useState(
    () => parsePostingFrequency(campaign?.posting_frequency).count,
  );
  const [frequencyUnit, setFrequencyUnit] = useState<
    (typeof FREQUENCY_UNITS)[number]
  >(() => parsePostingFrequency(campaign?.posting_frequency).unit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        content_pillars: form.content_pillars
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        posting_frequency: frequencyCount
          ? `${frequencyCount} per ${frequencyUnit}`
          : "",
      };
      if (campaign)
        await updateCampaign.mutateAsync({ id: campaign.id, patch: payload });
      else await createCampaign.mutateAsync(payload);
      onClose();
    } catch (saveError) {
      const detail = saveError instanceof Error ? saveError.message : "";
      setError(
        detail.includes("posting_frequency") ||
          detail.includes("target_audience") ||
          detail.includes("content_pillars") ||
          detail.includes("objective")
          ? "Campaign workflow fields are not in Supabase yet. Apply the latest database migration, then save again."
          : `Could not ${campaign ? "save" : "create"} this campaign. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        className="w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-t-[20px] sm:rounded-[20px] p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-semibold text-[#FAFAFA] tracking-tight">
            {campaign ? "Edit Campaign" : "New Campaign"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">
              Campaign Name *
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Finance Niche Sprint"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BrandedDateField
              label="Start date"
              value={form.start_date}
              onChange={(value) =>
                setForm((f) => ({ ...f, start_date: value }))
              }
            />
            <BrandedDateField
              label="End date"
              value={form.end_date}
              onChange={(value) => setForm((f) => ({ ...f, end_date: value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as CampaignStatus,
                }))
              }
              className="h-10 w-full rounded-[10px] bg-[#0D0D0D] border border-white/[0.08] px-3 text-[13px] text-[#FAFAFA] outline-none focus:border-primary/50"
            >
              {ALL_STATUSES.filter((status) => status !== "archived").map(
                (status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ),
              )}
            </select>
          </div>
          {error && (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#71717A]">
                Brand / Client
              </label>
              <Input
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="Your brand"
                className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#71717A]">Niche</label>
              <Input
                value={form.niche}
                onChange={(e) =>
                  setForm((f) => ({ ...f, niche: e.target.value }))
                }
                placeholder="e.g. Finance"
                className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Platform</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setForm((f) => ({ ...f, platform: p }))}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-all ${form.platform === p ? "bg-primary text-white" : "bg-[#0D0D0D] border border-white/[0.08] text-[#71717A] hover:text-[#FAFAFA]"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Goal</label>
            <Input
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              placeholder="e.g. Reach 10k followers"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Objective</label>
            <Input
              value={form.objective}
              onChange={(e) =>
                setForm((f) => ({ ...f, objective: e.target.value }))
              }
              placeholder="What should this campaign achieve?"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">
              Target audience
            </label>
            <Input
              value={form.target_audience}
              onChange={(e) =>
                setForm((f) => ({ ...f, target_audience: e.target.value }))
              }
              placeholder="e.g. new creators building an audience"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#71717A]">
                Content pillars
              </label>
              <Input
                value={form.content_pillars}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content_pillars: e.target.value }))
                }
                placeholder="Education, proof"
                className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#71717A]">
                Posting frequency
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={frequencyCount}
                  onChange={(e) => setFrequencyCount(e.target.value)}
                  placeholder="3"
                  className="h-10 w-20 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]"
                />
                <select
                  value={frequencyUnit}
                  onChange={(e) =>
                    setFrequencyUnit(
                      e.target.value as (typeof FREQUENCY_UNITS)[number],
                    )
                  }
                  className="h-10 min-w-0 flex-1 rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-2 text-[13px] text-[#FAFAFA]"
                >
                  {FREQUENCY_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      per {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 rounded-[10px] border-white/[0.08] bg-transparent text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 h-10 rounded-[10px] bg-primary text-white hover:bg-primary/90 text-[13px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : campaign ? (
                "Save Campaign"
              ) : (
                "Create Campaign"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ---- Campaign Card ------------------------------------------
function CampaignCard({
  campaign,
  onEdit,
}: {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
}) {
  const { updateCampaign, deleteCampaign, duplicateCampaign } = useCampaigns();
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.planning;
  const pct = campaign.completion_pct ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#111111] border border-white/[0.06] rounded-[16px] p-6 hover:border-white/[0.12] transition-all duration-200"
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-5">
        <span
          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border capitalize ${cfg.bg} ${cfg.color}`}
        >
          {cfg.label}
        </span>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-[#FAFAFA] transition-all p-1 rounded-[6px] hover:bg-white/[0.05]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-7 z-20 w-44 bg-[#161616] border border-white/[0.08] rounded-[12px] shadow-xl overflow-hidden py-1"
              >
                {[
                  {
                    icon: Pencil,
                    label: "Edit",
                    action: () => {
                      onEdit(campaign);
                      setMenuOpen(false);
                    },
                  },
                  {
                    icon: Copy,
                    label: "Duplicate",
                    action: () => {
                      duplicateCampaign.mutate(campaign);
                      setMenuOpen(false);
                    },
                  },
                  {
                    icon: Archive,
                    label: "Archive",
                    action: () => {
                      updateCampaign.mutate({
                        id: campaign.id,
                        patch: { status: "archived" },
                      });
                      setMenuOpen(false);
                    },
                  },
                  {
                    icon: Trash2,
                    label: "Delete",
                    action: () => {
                      deleteCampaign.mutate(campaign.id);
                      setMenuOpen(false);
                    },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-white/[0.05] ${item.label === "Delete" ? "text-red-400 hover:text-red-300" : "text-[#A1A1AA] hover:text-[#FAFAFA]"}`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Link
        to={`/dashboard/campaign-os/${campaign.id}`}
        className="block text-[15px] font-semibold text-[#FAFAFA] tracking-tight mb-1.5 line-clamp-1 hover:text-primary transition-colors"
      >
        {campaign.title}
      </Link>
      {campaign.brand && (
        <p className="text-[12px] text-[#71717A] mb-1">{campaign.brand}</p>
      )}

      <div className="flex flex-wrap gap-3 my-4 text-[12px] text-[#71717A]">
        {campaign.platform && (
          <span className="flex items-center gap-1 capitalize">
            <Rocket className="h-3 w-3" />
            {campaign.platform}
          </span>
        )}
        {campaign.niche && (
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {campaign.niche}
          </span>
        )}
        {campaign.clip_count != null && (
          <span>{campaign.clip_count} clips</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mt-4">
        <div className="flex items-center justify-between text-[11px] text-[#71717A]">
          <span>Progress</span>
          <span className="text-primary">{pct}%</span>
        </div>
        <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {campaign.goal && (
        <p className="text-[12px] text-[#71717A] mt-4 line-clamp-1">
          Goal: {campaign.goal}
        </p>
      )}
    </motion.div>
  );
}

// ---- Main Page ----------------------------------------------
export default function CampaignOSPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const { data: prompts } = useWorkspacePrompts();
  const { data: knowledge } = useWorkspaceKnowledge();
  const { data: entitlements } = useEntitlements();
  const currentTier = (entitlements?.tier ?? 'free') as PlanTier;
  const canUsePrompts = isFeatureUnlockedForTier(currentTier, 'prompt_library');
  const canUseKnowledge = isFeatureUnlockedForTier(currentTier, 'knowledge_vault');
  const promptLimit = getPromptLimitForTier(currentTier);
  const knowledgeLimit = getKnowledgeLimitForTier(currentTier);
  const promptList = prompts ?? [];
  const knowledgeList = knowledge ?? [];
  const knowledgeValues = knowledgeList.map((k: any) => k.content_excerpt ?? k.content ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedPromptTitles, setSelectedPromptTitles] = useState<string[]>([]);
  const [selectedKnowledgeSnippets, setSelectedKnowledgeSnippets] = useState<string[]>([]);
  const [allPromptsSelected, setAllPromptsSelected] = useState(false);
  const [allKnowledgeSelected, setAllKnowledgeSelected] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const promptMenuRef = useRef<HTMLDivElement | null>(null);
  const knowledgeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (promptOpen && promptMenuRef.current && !promptMenuRef.current.contains(target)) {
        setPromptOpen(false);
      }
      if (knowledgeOpen && knowledgeMenuRef.current && !knowledgeMenuRef.current.contains(target)) {
        setKnowledgeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPromptOpen(false);
        setKnowledgeOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [promptOpen, knowledgeOpen]);

  const visible =
    filter === "all"
      ? campaigns
      : campaigns?.filter((c) => c.status === filter);

  return (
    <div className="os-page max-w-6xl animate-in fade-in duration-500">
      {!canUsePrompts && (
        <div className="mb-5">
          <UpgradePrompt feature="Prompt selector" requiredPlan="creator" description={getTierUpgradeMessage(currentTier, 'prompt_library')} />
        </div>
      )}
      {!canUseKnowledge && (
        <div className="mb-5">
          <UpgradePrompt feature="Knowledge selector" requiredPlan="creator" description={getTierUpgradeMessage(currentTier, 'knowledge_vault')} />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">
            Campaign OS
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1">
            Manage every campaign from research to growth.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] text-[13px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Campaign
        </Button>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-[18px] border border-white/[0.06] bg-[#111111] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#71717A]">Workflow context</p>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">Saved prompt + knowledge feed this campaign plan.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={promptMenuRef}>
            {canUsePrompts ? (
              <button
              type="button"
              onClick={() => setPromptOpen((open) => !open)}
              className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-3 text-[12px] text-[#FAFAFA] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.2)] transition-all hover:border-primary/30"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Prompt</span>
              <span className="max-w-[160px] truncate text-[#FAFAFA]">{allPromptsSelected ? 'All prompts' : selectedPromptTitles.length ? `${selectedPromptTitles.length} prompt${selectedPromptTitles.length > 1 ? 's' : ''}` : 'No prompt'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
              </button>
            ) : (
              <div className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[#111111] px-3 text-[12px] text-[#71717A]">
                <span>Prompt limit</span>
                <span className="text-primary">{promptLimit < 0 ? 'Unlimited' : `${promptLimit}`}</span>
              </div>
            )}
            {promptOpen && canUsePrompts && (
              <div className="absolute left-0 z-20 mt-2 w-80 max-h-72 overflow-auto rounded-[16px] border border-white/[0.08] bg-[#111111]/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.38),0_0_0_1px_rgba(124,58,237,0.12)] backdrop-blur-md">
                <div className="mb-1 px-2 pt-1 pb-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Saved prompts</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPromptIds([]);
                    setSelectedPromptTitles([]);
                    setAllPromptsSelected(false);
                    setPromptOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${!allPromptsSelected && selectedPromptIds.length === 0 ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">No prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextAll = !allPromptsSelected;
                    setAllPromptsSelected(nextAll);
                    if (nextAll) {
                      setSelectedPromptIds(promptList.map((p: any) => p.id));
                      setSelectedPromptTitles(promptList.map((p: any) => p.title));
                    } else {
                      setSelectedPromptIds([]);
                      setSelectedPromptTitles([]);
                    }
                    setPromptOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${allPromptsSelected ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">All prompts</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#71717A]">{promptList.length}</span>
                </button>
                {promptList.map((p: any) => {
                  const checked = allPromptsSelected || selectedPromptIds.includes(p.id);
                  return (
                    <label key={p.id} className={`mt-1 flex cursor-pointer items-start gap-2 rounded-[10px] border px-2.5 py-2.5 transition-colors ${checked ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setAllPromptsSelected(false);
                          setSelectedPromptIds((prev) => {
                            const next = isChecked ? [...new Set([...prev, p.id])] : prev.filter((id) => id !== p.id);
                            setSelectedPromptTitles(promptList.filter((item: any) => next.includes(item.id)).map((item: any) => item.title));
                            return next;
                          });
                          setPromptOpen(false);
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-white/[0.1] bg-[#0D0D0D] accent-[#7C3AED]"
                      />
                      <span className="flex-1 text-left text-[12px] leading-5 text-[#E4E4E7]">
                        <span className="mb-0.5 block font-medium text-[#FAFAFA]">{p.title}</span>
                        <span className="text-[#A1A1AA]">{(p.content ?? '').slice(0, 110)}{((p.content ?? '').length > 110 ? '…' : '')}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative" ref={knowledgeMenuRef}>
            {canUseKnowledge ? (
              <button
              type="button"
              onClick={() => setKnowledgeOpen((open) => !open)}
              className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-3 text-[12px] text-[#FAFAFA] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.2)] transition-all hover:border-primary/30"
            >
              <span>{allKnowledgeSelected ? 'All knowledge' : selectedKnowledgeSnippets.length ? `${selectedKnowledgeSnippets.length} knowledge` : 'Knowledge'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
              </button>
            ) : (
              <div className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[#111111] px-3 text-[12px] text-[#71717A]">
                <span>Knowledge limit</span>
                <span className="text-primary">{knowledgeLimit < 0 ? 'Unlimited' : `${knowledgeLimit}`}</span>
              </div>
            )}
            {knowledgeOpen && canUseKnowledge && (
              <div className="absolute left-0 z-20 mt-2 w-80 max-h-72 overflow-auto rounded-[16px] border border-white/[0.08] bg-[#111111]/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.38),0_0_0_1px_rgba(124,58,237,0.12)] backdrop-blur-md">
                <div className="mb-1 px-2 pt-1 pb-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Knowledge sources</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAllKnowledgeSelected(false);
                    setSelectedKnowledgeSnippets([]);
                    setKnowledgeOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${!allKnowledgeSelected && selectedKnowledgeSnippets.length === 0 ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">No knowledge</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextAll = !allKnowledgeSelected;
                    setAllKnowledgeSelected(nextAll);
                    setSelectedKnowledgeSnippets(nextAll ? knowledgeValues : []);
                    setKnowledgeOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${allKnowledgeSelected ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">All knowledge</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#71717A]">{knowledgeValues.length}</span>
                </button>
                {knowledgeList.length > 0 ? knowledgeList.map((k: any) => {
                  const value = k.content_excerpt ?? k.content ?? '';
                  const checked = allKnowledgeSelected || selectedKnowledgeSnippets.includes(value);
                  return (
                    <label key={k.id} className={`mt-1 flex cursor-pointer items-start gap-2 rounded-[10px] border px-2.5 py-2.5 transition-colors ${checked ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}>
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const val = value;
                        setAllKnowledgeSelected(false);
                        setSelectedKnowledgeSnippets((prev) => e.target.checked ? [...new Set([...prev, val])] : prev.filter((x) => x !== val));
                      }} className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-white/[0.1] bg-[#0D0D0D] accent-[#7C3AED]" />
                      <span className="flex-1 text-left text-[12px] leading-5 text-[#E4E4E7]">
                        <span className="mb-0.5 block font-medium text-[#FAFAFA]">{k.title}</span>
                        <span className="text-[#A1A1AA]">{(k.content_excerpt ?? k.content ?? '').slice(0, 110)}{((k.content_excerpt ?? k.content ?? '').length > 110 ? '…' : '')}</span>
                      </span>
                    </label>
                  );
                }) : (
                  <div className="px-3 py-3 text-[12px] text-[#71717A]">No knowledge items yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${filter === "all" ? "bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]" : "bg-[#111111] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]"}`}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all ${filter === s ? "bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]" : "bg-[#111111] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]"}`}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-[16px] bg-[#111111] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : !visible?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mb-5">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#FAFAFA] mb-2">
            No campaigns yet
          </h3>
          <p className="text-[14px] text-[#71717A] max-w-sm mb-6">
            Create your first campaign to start organizing your content
            production from research to growth.
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 text-[13px]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Campaign
          </Button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          <AnimatePresence>
            {visible?.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onEdit={setEditingCampaign}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showCreate && <CampaignModal onClose={() => setShowCreate(false)} />}
        {editingCampaign && (
          <CampaignModal
            campaign={editingCampaign}
            onClose={() => setEditingCampaign(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
