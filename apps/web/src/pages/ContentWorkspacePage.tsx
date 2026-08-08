import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save, Sparkles, Upload } from "lucide-react";
import { useCampaign, useClips, Clip } from "@/hooks/useCampaigns";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useAI } from "@/hooks/useAI";
import {
  buildGenerateCaptionPrompt,
  buildGenerateHooksPrompt,
} from "@/lib/ai-services";
import { getReadinessIssues, getTransitionIssue } from "@/lib/clipWorkflow";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type StoryboardScene = {
  scene?: string;
  visuals?: string;
  audio?: string;
  duration?: string;
  type?: string;
  content?: string;
};

function parseStoryboard(
  content?: string,
): { scenes: StoryboardScene[]; caption?: string } | null {
  if (!content?.trim()) return null;
  try {
    const parsed = JSON.parse(
      content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
    ) as {
      script?: string | StoryboardScene[];
      caption?: string;
      captions?: string;
    };
    if (Array.isArray(parsed.script)) {
      return {
        scenes: parsed.script,
        caption: parsed.caption || parsed.captions,
      };
    }
  } catch {
    /* A plain script is handled by the clean-text fallback. */
  }
  return null;
}

function MediaUploader({
  workspaceId,
  clipId,
  mediaPath,
  onUploaded,
}: {
  workspaceId: string;
  clipId: string;
  mediaPath?: string;
  onUploaded: (path: string, file: File) => Promise<void>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
      setError("Choose a video or image file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Files must be 100 MB or smaller.");
      return;
    }
    setError("");
    setIsUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${workspaceId}/${clipId}/${crypto.randomUUID()}-${safeName}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("clip-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      await onUploaded(path, file);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Please retry.",
      );
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-[#71717A]">Media file</p>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-primary/40 bg-primary/[0.04] px-3 py-3 text-[12px] font-medium text-primary hover:bg-primary/[0.08]">
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isUploading
          ? "Uploading…"
          : mediaPath
            ? "Replace uploaded media"
            : "Upload video or image"}
        <input
          type="file"
          accept="video/*,image/*"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => void handleUpload(event)}
        />
      </label>
      {mediaPath && (
        <p className="truncate text-[11px] text-emerald-400">
          Uploaded and attached
        </p>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContentWorkspacePage() {
  const { campaignId, clipId } = useParams();
  const { data: campaign } = useCampaign(campaignId);
  const { data: clips, isLoading, updateClip } = useClips(campaignId);
  const { activeWorkspace } = useWorkspaceStore();
  const {
    generate,
    generateJSON,
    isGenerating,
    error: aiError,
    clearError,
  } = useAI();
  const clip = useMemo(
    () => clips?.find((item) => item.id === clipId),
    [clips, clipId],
  );
  const [draft, setDraft] = useState<Partial<Clip>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (clip) setDraft(clip);
  }, [clip]);
  if (isLoading)
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
      </div>
    );
  if (!campaign || !clip)
    return (
      <div>
        <Link to="/dashboard/campaign-os" className="text-primary text-sm">
          Back to Campaign OS
        </Link>
        <p className="mt-4 text-sm text-red-400">
          This content item was not found or you do not have access.
        </p>
      </div>
    );

  const workspace = {
    id: activeWorkspace?.id ?? "default",
    name: activeWorkspace?.name ?? "Workspace",
  };
  const patchDraft = (patch: Partial<Clip>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const updateScene = (
    index: number,
    field: keyof StoryboardScene,
    value: string,
  ) => {
    const storyboard = parseStoryboard(draft.script);
    if (!storyboard) return;
    storyboard.scenes[index] = { ...storyboard.scenes[index], [field]: value };
    patchDraft({
      script: JSON.stringify(
        { script: storyboard.scenes, caption: storyboard.caption },
        null,
        2,
      ),
    });
  };
  const saveUploadedMedia = async (path: string, file: File) => {
    try {
      await updateClip.mutateAsync({
        id: clip.id,
        patch: {
          media_path: path,
          media_url: undefined,
          media_type: file.type,
          media_status: "attached",
        },
      });
      patchDraft({
        media_path: path,
        media_url: undefined,
        media_type: file.type,
        media_status: "attached",
      });
      setMessage("Media uploaded and attached to this content item.");
    } catch (saveError) {
      await supabase.storage.from("clip-media").remove([path]);
      throw saveError;
    }
  };
  const save = async (nextStatus?: Clip["status"]) => {
    const target = { ...draft, status: nextStatus ?? draft.status };
    const transitionIssue = nextStatus
      ? getTransitionIssue(target, nextStatus)
      : null;
    if (transitionIssue) {
      setMessage(transitionIssue);
      return;
    }
    try {
      await updateClip.mutateAsync({ id: clip.id, patch: target });
      setMessage(
        nextStatus ? `Saved and moved to ${nextStatus}.` : "Changes saved.",
      );
    } catch {
      setMessage("Could not save this content item. Please retry.");
    }
  };
  const generateScript = async () => {
    clearError();
    setMessage("");
    try {
      const response = await generate(
        {
          systemPrompt: `Create a short-form production storyboard for "${draft.title || clip.title}".`,
          developerPrompt: `Platform: ${draft.platform || clip.platform || "TikTok"}. Use this hook: ${draft.hook || "create a compelling hook"}. Return a JSON object only: {"script":[{"scene":"INTRO","visuals":"what appears on screen","audio":"exact spoken words","duration":"2 seconds"}],"caption":"one optional supporting caption"}. Build 4-7 concise scenes. Keep audio natural and immediately recordable.`,
          taskContext: {
            workspace,
            workflowStage: "idea",
            userPreferences: {},
            memory: [],
            previousGenerations: [],
          },
          temperature: 0.7,
        },
        { category: "custom", promptSummary: `Storyboard: ${clip.title}` },
      );
      const storyboard = parseStoryboard(response.content);
      if (!storyboard)
        throw new Error(
          "The AI did not return a usable storyboard. Please regenerate it.",
        );
      patchDraft({
        script: JSON.stringify(
          { script: storyboard.scenes, caption: storyboard.caption },
          null,
          2,
        ),
        status: draft.status === "idea" ? "writing" : draft.status,
      });
      setMessage(
        "Storyboard generated. Edit any scene, then save your changes.",
      );
    } catch {
      /* AI hook exposes the actionable error. */
    }
  };
  const generateHook = async () => {
    clearError();
    setMessage("");
    try {
      const result = await generateJSON<{ hooks: Array<{ content: string }> }>(
        buildGenerateHooksPrompt({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          ideaTitle: draft.title || clip.title,
          platform: draft.platform,
        }),
        { category: "hook", promptSummary: `Hook: ${clip.title}` },
      );
      patchDraft({ hook: result.hooks?.[0]?.content ?? draft.hook });
      setMessage("Hook generated. Review it, then save your changes.");
    } catch {
      /* shown by useAI */
    }
  };
  const generateCaption = async () => {
    clearError();
    setMessage("");
    try {
      const result = await generateJSON<{
        caption: string;
        cta: string;
        hashtags: string[];
      }>(
        buildGenerateCaptionPrompt({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          ideaTitle: draft.title || clip.title,
          selectedHook: draft.hook,
          platform: draft.platform,
        }),
        { category: "caption", promptSummary: `Caption: ${clip.title}` },
      );
      patchDraft({
        caption: result.caption,
        cta: result.cta,
        hashtags: result.hashtags,
      });
      setMessage(
        "Caption, CTA, and hashtags generated. Review them, then save your changes.",
      );
    } catch {
      /* shown by useAI */
    }
  };
  const readiness = getReadinessIssues(draft);
  const storyboard = parseStoryboard(draft.script);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={`/dashboard/campaign-os/${campaign.id}`}
            className="inline-flex items-center gap-1 text-[13px] text-[#71717A] hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {campaign.title}
          </Link>
          <h2 className="mt-2 text-[24px] font-semibold text-[#FAFAFA]">
            {clip.title}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void save()}
            disabled={updateClip.isPending}
            className="border-white/[0.1] bg-transparent text-[#FAFAFA]"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button
            onClick={() => void save("ready")}
            disabled={updateClip.isPending}
            className="bg-primary text-white"
          >
            Mark ready
          </Button>
        </div>
      </div>
      {(message || aiError) && (
        <p
          role="status"
          className={`rounded-[10px] border px-3 py-2 text-[12px] ${aiError || message.startsWith("Could") || message.startsWith("Complete") ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}
        >
          {aiError || message}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-5 space-y-4">
            <label className="block text-[12px] text-[#71717A]">
              Content title
              <input
                value={draft.title ?? ""}
                onChange={(e) => patchDraft({ title: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void generateHook()}
                disabled={isGenerating}
                variant="outline"
                className="border-white/[0.1] bg-transparent text-[#FAFAFA]"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Improve hook
              </Button>
              <Button
                onClick={() => void generateScript()}
                disabled={isGenerating}
                variant="outline"
                className="border-white/[0.1] bg-transparent text-[#FAFAFA]"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Generate storyboard
              </Button>
              <Button
                onClick={() => void generateCaption()}
                disabled={isGenerating}
                variant="outline"
                className="border-white/[0.1] bg-transparent text-[#FAFAFA]"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Generate caption
              </Button>
            </div>
            <label className="block text-[12px] text-[#71717A]">
              Hook
              <textarea
                value={draft.hook ?? ""}
                onChange={(e) => patchDraft({ hook: e.target.value })}
                className="mt-1.5 min-h-20 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] p-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-[#71717A]">
                  Production storyboard
                </p>
                {storyboard && (
                  <span className="text-[11px] text-primary">
                    {storyboard.scenes.length} scenes
                  </span>
                )}
              </div>
              {storyboard ? (
                <div className="space-y-3">
                  {storyboard.scenes.map((scene, index) => (
                    <article
                      key={index}
                      className="rounded-[14px] border border-white/[0.07] bg-[#0D0D0D] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <input
                          value={scene.scene ?? `Scene ${index + 1}`}
                          onChange={(e) =>
                            updateScene(index, "scene", e.target.value)
                          }
                          className="w-40 bg-transparent text-[12px] font-semibold uppercase tracking-wider text-primary outline-none"
                        />
                        <input
                          value={scene.duration ?? ""}
                          onChange={(e) =>
                            updateScene(index, "duration", e.target.value)
                          }
                          placeholder="Duration"
                          className="w-24 rounded-full border border-white/[0.08] bg-[#161616] px-2 py-1 text-right text-[11px] text-[#A1A1AA] outline-none"
                        />
                      </div>
                      <label className="block text-[11px] text-[#71717A]">
                        Spoken line
                        <textarea
                          value={scene.audio ?? scene.content ?? ""}
                          onChange={(e) =>
                            updateScene(
                              index,
                              scene.audio !== undefined ? "audio" : "content",
                              e.target.value,
                            )
                          }
                          className="mt-1 w-full min-h-20 rounded-[10px] border border-white/[0.08] bg-[#161616] p-3 text-[13px] leading-relaxed text-[#FAFAFA]"
                        />
                      </label>
                      <label className="mt-3 block text-[11px] text-[#71717A]">
                        Visual direction
                        <textarea
                          value={scene.visuals ?? ""}
                          onChange={(e) =>
                            updateScene(index, "visuals", e.target.value)
                          }
                          className="mt-1 w-full min-h-16 rounded-[10px] border border-white/[0.08] bg-[#161616] p-3 text-[12px] leading-relaxed text-[#A1A1AA]"
                        />
                      </label>
                    </article>
                  ))}
                </div>
              ) : (
                <label className="block text-[12px] text-[#71717A]">
                  Script
                  <textarea
                    value={draft.script ?? ""}
                    onChange={(e) => patchDraft({ script: e.target.value })}
                    placeholder="Generate a storyboard, or write your script here…"
                    className="mt-1.5 min-h-52 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] p-3 text-[13px] text-[#FAFAFA]"
                  />
                </label>
              )}
            </div>
            <label className="block text-[12px] text-[#71717A]">
              Caption
              <textarea
                value={draft.caption ?? storyboard?.caption ?? ""}
                onChange={(e) => patchDraft({ caption: e.target.value })}
                className="mt-1.5 min-h-28 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] p-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
            <label className="block text-[12px] text-[#71717A]">
              CTA
              <input
                value={draft.cta ?? ""}
                onChange={(e) => patchDraft({ cta: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-[#FAFAFA]">
              Production details
            </h3>
            <label className="block text-[12px] text-[#71717A]">
              Platform
              <select
                value={draft.platform ?? ""}
                onChange={(e) => patchDraft({ platform: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA]"
              >
                <option value="">Select platform</option>
                {["tiktok", "instagram", "youtube", "twitter"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <MediaUploader
              workspaceId={workspace.id}
              clipId={clip.id}
              mediaPath={draft.media_path}
              onUploaded={saveUploadedMedia}
            />
            <div className="border-t border-white/[0.06]" />
            <label className="block text-[12px] text-[#71717A]">
              Or attach a media URL
              <input
                value={draft.media_url ?? ""}
                onChange={(e) =>
                  patchDraft({
                    media_url: e.target.value,
                    media_status: e.target.value ? "attached" : "missing",
                  })
                }
                placeholder="https://…"
                className="mt-1.5 h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
            <p className="text-[11px] leading-relaxed text-[#71717A]">Uploads are stored privately in your workspace. A URL is useful when your finished media already lives elsewhere.</p>
            <label className="block text-[12px] text-[#71717A]">
              Schedule (local time)
              <input
                type="datetime-local"
                value={draft.publishing_date?.slice(0, 16) ?? ""}
                onChange={(e) =>
                  patchDraft({
                    publishing_date: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
            <label className="block text-[12px] text-[#71717A]">
              Timezone
              <input
                value={draft.timezone ?? "UTC"}
                onChange={(e) => patchDraft({ timezone: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA]"
              />
            </label>
            <Button
              onClick={() => void save("scheduled")}
              disabled={updateClip.isPending}
              className="w-full bg-primary text-white"
            >
              Schedule content
            </Button>
          </section>
          <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-5">
            <h3 className="text-[13px] font-semibold text-[#FAFAFA]">
              Ready check
            </h3>
            {readiness.length ? (
              <p className="mt-2 text-[12px] leading-relaxed text-[#FBBF24]">
                Still needed: {readiness.join(", ")}.
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-emerald-400">
                Production assets complete.
              </p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-[#71717A]">
              Publication remains unavailable until an official social
              integration is connected. Scheduled does not mean published.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
