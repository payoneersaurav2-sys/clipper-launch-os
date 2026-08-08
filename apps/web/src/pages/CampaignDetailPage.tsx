import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  useCampaign,
  useCampaigns,
  useClips,
  ClipStatus,
} from "@/hooks/useCampaigns";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useAI } from "@/hooks/useAI";
import { buildCampaignPlanPrompt } from "@/lib/ai-services";
import { Button } from "@/components/ui/button";
import { getTransitionIssue } from "@/lib/clipWorkflow";
import { BrandedDateTimePicker } from "@/components/BrandedDateControls";
import { useEntitlements } from "@/hooks/useEntitlements";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const statuses: ClipStatus[] = [
  "idea",
  "writing",
  "editing",
  "ready",
  "scheduled",
  "published",
  "analyzed",
];
const quantities = [10, 20, 30];

type CampaignPlan = {
  strategy?: string;
  contentPillars?: string[];
  postingFrequency?: string;
  schedule?: Array<{
    topic?: string;
    platform?: string;
    hook?: string;
    cta?: string;
    contentPillar?: string;
    notes?: string;
  }>;
};

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const { activeWorkspace } = useWorkspaceStore();
  const { data: campaign, isLoading, error } = useCampaign(campaignId);
  const { updateCampaign } = useCampaigns();
  const {
    data: clips,
    isLoading: clipsLoading,
    updateClip,
    createClips,
  } = useClips(campaignId);
  const { generateJSON, isGenerating, error: aiError, clearError } = useAI();
  const { data: entitlements } = useEntitlements();
  const [contentError, setContentError] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [generationNotice, setGenerationNotice] = useState("");
  const maxContentBatch = entitlements?.limits?.content_batch_size ?? 10;

  if (isLoading)
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
      </div>
    );
  if (error || !campaign)
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/campaign-os"
          className="text-[13px] text-primary hover:underline"
        >
          Back to Campaign OS
        </Link>
        <p className="text-sm text-red-400">
          Campaign not found or you do not have access.
        </p>
      </div>
    );

  const content = clips ?? [];
  const published = content.filter(
    (clip) => clip.status === "published" || clip.status === "analyzed",
  );
  const scheduled = content.filter((clip) => clip.status === "scheduled");
  const totalViews = content.reduce((sum, clip) => sum + (clip.views ?? 0), 0);
  const totalLikes = content.reduce((sum, clip) => sum + (clip.likes ?? 0), 0);
  const progress = content.length
    ? Math.round((published.length / content.length) * 100)
    : 0;

  const update = async (
    clipId: string,
    patch: Record<string, string | null>,
  ) => {
    const target = content.find((item) => item.id === clipId);
    const nextStatus = patch.status as ClipStatus | undefined;
    const transitionIssue =
      nextStatus && target
        ? getTransitionIssue({ ...target, ...patch }, nextStatus)
        : null;
    if (transitionIssue) {
      setContentError(transitionIssue);
      return;
    }
    setContentError("");
    try {
      await updateClip.mutateAsync({ id: clipId, patch });
    } catch {
      setContentError("Could not update this content item. Please try again.");
    }
  };

  const generateContentPlan = async () => {
    if (!activeWorkspace?.id) {
      setGenerationNotice("Select a workspace before generating content.");
      return;
    }
    clearError();
    setGenerationNotice("");
    setContentError("");
    try {
      const plan = await generateJSON<CampaignPlan>(
        buildCampaignPlanPrompt({
          workspaceId: activeWorkspace.id,
          workspaceName: activeWorkspace.name,
          topic: campaign.title,
          platform: campaign.platform,
          goal: campaign.goal || campaign.objective,
          niche: campaign.niche,
          durationDays: quantity,
        }),
        {
          category: "campaign",
          promptSummary: `Campaign content plan: ${campaign.title}`,
        },
      );
      const schedule = (plan.schedule ?? [])
        .slice(0, quantity)
        .filter((item) => item.topic?.trim());
      if (!schedule.length)
        throw new Error(
          "The AI response did not include usable content ideas. Please retry.",
        );
      await createClips.mutateAsync(
        schedule.map((item) => ({
          campaign_id: campaign.id,
          title: item.topic!.trim(),
          hook: item.hook,
          cta: item.cta,
          platform: item.platform || campaign.platform || "tiktok",
          content_pillar: item.contentPillar,
          notes: item.notes,
          status: "idea" as ClipStatus,
        })),
      );
      await updateCampaign.mutateAsync({
        id: campaign.id,
        patch: {
          ai_strategy: {
            strategy: plan.strategy,
            growthTips: (plan as any).growthTips ?? [],
          },
          content_pillars:
            plan.contentPillars?.filter(Boolean) ?? campaign.content_pillars,
          posting_frequency:
            plan.postingFrequency || campaign.posting_frequency,
        },
      });
      setGenerationNotice(
        `${schedule.length} content ideas were saved to this campaign and the Clip Pipeline.`,
      );
    } catch (generationError) {
      setGenerationNotice(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate this content plan. Please retry.",
      );
    }
  };

  return (
    <div className="max-w-6xl space-y-7 animate-in fade-in duration-500">
      <div className="space-y-3">
        <Link
          to="/dashboard/campaign-os"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Campaign OS
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">
              {campaign.title}
            </h2>
            <p className="mt-1 text-[13px] text-[#71717A]">
              {campaign.brand || "Creator campaign"} ·{" "}
              {campaign.platform || "No platform selected"} ·{" "}
              {campaign.niche || "No niche selected"}
            </p>
          </div>
          <Link
            to="/dashboard/clip-pipeline"
            state={{ campaignId: campaign.id }}
          >
            <Button className="h-10 rounded-[12px] bg-primary text-white text-[13px]">
              Manage Clips
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Content progress", `${progress}%`],
          ["Published", String(published.length)],
          ["Views recorded", totalViews.toLocaleString()],
          ["Likes recorded", totalLikes.toLocaleString()],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[16px] border border-white/[0.06] bg-[#111111] p-5"
          >
            <p className="text-[12px] text-[#71717A]">{label}</p>
            <p className="mt-2 text-[24px] font-semibold text-[#FAFAFA]">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 lg:col-span-2">
          <h3 className="text-[14px] font-semibold text-[#FAFAFA]">
            Campaign strategy
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-[#A1A1AA]">
            {(campaign.ai_strategy?.strategy as string | undefined) ||
              campaign.objective ||
              "Set an objective, then generate a content plan to save an AI strategy here."}
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-[13px]">
            <div>
              <dt className="text-[#71717A]">Target audience</dt>
              <dd className="mt-1 text-[#FAFAFA]">
                {campaign.target_audience || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-[#71717A]">Pillars / frequency</dt>
              <dd className="mt-1 text-[#FAFAFA]">
                {campaign.content_pillars?.join(", ") || "Not set"}{" "}
                {campaign.posting_frequency
                  ? `· ${campaign.posting_frequency}`
                  : ""}
              </dd>
            </div>
          </dl>
        </section>
        <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6">
          <CalendarDays className="h-4 w-4 text-primary" />
          <p className="mt-3 text-[13px] text-[#71717A]">
            Upcoming scheduled content
          </p>
          <p className="mt-1 text-[24px] font-semibold text-[#FAFAFA]">
            {scheduled.length}
          </p>
        </section>
      </div>
      <section className="rounded-[18px] border border-primary/20 bg-primary/[0.04] p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[14px] font-semibold text-[#FAFAFA]">
              Generate Content Plan
            </h3>
            <p className="mt-1 text-[12px] text-[#A1A1AA]">
              Uses the configured OpenRouter AI provider and saves each idea as
              a real pipeline item.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quantities.map((value) => (
              <button
                key={value}
                onClick={() => setQuantity(value)}
                disabled={value > maxContentBatch}
                aria-label={value > maxContentBatch ? `${value} content ideas require a higher plan` : `Generate ${value} content ideas`}
                className={`rounded-full px-3 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${quantity === value ? "bg-primary text-white" : "border border-white/[0.08] text-[#A1A1AA]"}`}
              >
                {value}
              </button>
            ))}
            <Button
              disabled={isGenerating || createClips.isPending}
              onClick={() => void generateContentPlan()}
              className="h-10 rounded-[10px] bg-primary text-[13px] text-white"
            >
              {isGenerating || createClips.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        </div>
        {maxContentBatch < 20 && (
          <div className="mt-4">
            <UpgradePrompt
              compact
              feature="Larger content batches"
              requiredPlan="pro"
              description="Creator includes up to 10 ideas at a time."
            />
          </div>
        )}
        {(aiError || generationNotice) && (
          <p
            role="status"
            className={`mt-3 text-[12px] ${aiError || generationNotice.startsWith("Could") || generationNotice.startsWith("The AI") ? "text-red-400" : "text-emerald-400"}`}
          >
            {aiError || generationNotice}
          </p>
        )}
      </section>
      <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-[14px] font-semibold text-[#FAFAFA]">
            Campaign content
          </h3>
        </div>
        {contentError && (
          <p role="alert" className="mb-3 text-[12px] text-red-400">
            {contentError}
          </p>
        )}
        {clipsLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
        ) : !content.length ? (
          <p className="text-[13px] text-[#71717A]">
            No content is linked yet. Generate a plan or add a clip in the
            pipeline.
          </p>
        ) : (
          <div className="space-y-2">
            {content.map((clip) => (
              <div
                key={clip.id}
                className="grid gap-3 rounded-[12px] border border-white/[0.05] p-3 md:grid-cols-[1fr_130px_260px]"
              >
                <Link
                  to={`/dashboard/campaign-os/${campaign.id}/content/${clip.id}`}
                  className="text-[13px] font-medium text-[#FAFAFA] hover:text-primary"
                >
                  {clip.title}
                </Link>
                <select
                  value={clip.status}
                  onChange={(event) =>
                    void update(clip.id, { status: event.target.value })
                  }
                  className="rounded-[8px] border border-white/[0.08] bg-[#0D0D0D] px-2 text-[12px] text-[#FAFAFA]"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <BrandedDateTimePicker
                  value={clip.publishing_date}
                  onChange={(publishing_date) =>
                    void update(clip.id, { publishing_date: publishing_date ?? null })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
