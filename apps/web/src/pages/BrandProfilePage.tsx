import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useBrandProfile, BrandProfile } from '@/hooks/useBrandProfile';
import { Card } from '@/components/ui/card';
import { 
  Building2, Users, MessageSquare, Target, 
  ShoppingBag, Share2, ShieldCheck, Check, Edit2, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SectionKey = 'identity' | 'audience' | 'voice' | 'strategy' | 'offers' | 'platforms' | 'guidelines';

export default function BrandProfilePage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: profile, isLoading, updateProfile } = useBrandProfile();
  
  const [activeSection, setActiveSection] = useState<SectionKey>('identity');
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<BrandProfile>>({});

  const startEditing = (section: SectionKey) => {
    setFormData(profile || {});
    setEditingSection(section);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      setEditingSection(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Select a client to view their profile.
      </div>
    );
  }

  // Calculate completion
  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.short_description,
      profile.industry,
      profile.target_audience,
      profile.audience_problems,
      profile.tone,
      profile.writing_style,
      profile.content_pillars?.length ? true : null,
      profile.primary_offer,
      profile.platforms?.length ? true : null,
      profile.do_guidelines,
    ];
    const filled = fields.filter(f => f !== null && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const sections = [
    { id: 'identity', label: 'Brand Identity', icon: Building2 },
    { id: 'audience', label: 'Target Audience', icon: Users },
    { id: 'voice', label: 'Brand Voice', icon: MessageSquare },
    { id: 'strategy', label: 'Content Strategy', icon: Target },
    { id: 'offers', label: 'Offers & Products', icon: ShoppingBag },
    { id: 'platforms', label: 'Platforms', icon: Share2 },
    { id: 'guidelines', label: 'Guidelines', icon: ShieldCheck },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {!isLoading && !profile && !editingSection && (
        <div className="mb-8">
          <Card className="bg-white/5 border-white/10 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Let's define this brand.</h2>
            <p className="text-zinc-400 mb-6 max-w-md">Add a few details about this client so Creator OS can work with the right context later.</p>
            <button onClick={() => startEditing('identity')} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors">Complete Profile</button>
          </Card>
        </div>
      )}
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
            <Building2 className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{activeWorkspace.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">
                {profile?.industry || 'Setup Industry'}
              </span>
              <span className="text-zinc-500">
                {profile?.website || 'No website added'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile Completion</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
            <span className="text-sm font-medium text-white">{calculateCompletion()}%</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as SectionKey)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                activeSection === section.id
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <section.icon className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                activeSection === section.id ? "text-primary" : ""
              )} />
              {section.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {sections.find(s => s.id === activeSection)?.label}
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Define the core context for {activeWorkspace.name}.
                  </p>
                </div>
                {editingSection !== activeSection ? (
                  <button
                    onClick={() => startEditing(activeSection)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Section
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave()}
                      disabled={updateProfile.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {activeSection === 'identity' && (
                  <IdentitySection 
                    isEditing={editingSection === 'identity'} 
                    data={editingSection === 'identity' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
                {activeSection === 'audience' && (
                  <AudienceSection 
                    isEditing={editingSection === 'audience'} 
                    data={editingSection === 'audience' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
                {activeSection === 'voice' && (
                  <VoiceSection 
                    isEditing={editingSection === 'voice'} 
                    data={editingSection === 'voice' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
                {activeSection === 'strategy' && (
                  <StrategySection 
                    isEditing={editingSection === 'strategy'} 
                    data={editingSection === 'strategy' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
                {activeSection === 'offers' && (
                  <OffersSection 
                    isEditing={editingSection === 'offers'} 
                    data={editingSection === 'offers' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
                {activeSection === 'platforms' && (
                  <PlatformsSection 
                    isEditing={editingSection === 'platforms'} 
                    data={editingSection === 'platforms' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
                {activeSection === 'guidelines' && (
                  <GuidelinesSection 
                    isEditing={editingSection === 'guidelines'} 
                    data={editingSection === 'guidelines' ? formData : profile} 
                    onChange={(updates: Partial<BrandProfile>) => setFormData({ ...formData, ...updates })} 
                  />
                )}
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Section Components ---

function Field({ label, description, isEditing, value, onChange, type = 'text', placeholder = '' }: any) {
  return (
    <div className="space-y-2 border-b border-white/5 pb-6 last:border-0 last:pb-0">
      <label className="block text-sm font-medium text-white">{label}</label>
      {description && <p className="text-xs text-zinc-500 mb-2">{description}</p>}
      
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )
      ) : (
        <div className="text-sm text-zinc-300 bg-white/5 rounded-lg px-4 py-3 min-h-[44px] whitespace-pre-wrap">
          {value || <span className="text-zinc-600 italic">Not provided</span>}
        </div>
      )}
    </div>
  );
}

function IdentitySection({ isEditing, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <Field label="Website" description="The primary domain for this brand." isEditing={isEditing} value={data?.website} onChange={(val: string) => onChange({ website: val })} placeholder="https://..." />
      <Field label="Industry / Category" description="Broad category (e.g., Fitness, B2B SaaS, Real Estate)." isEditing={isEditing} value={data?.industry} onChange={(val: string) => onChange({ industry: val })} />
      <Field label="Location / Market" description="Primary geographic market." isEditing={isEditing} value={data?.location} onChange={(val: string) => onChange({ location: val })} />
      <Field label="Tell Creator OS about this brand" description="A short summary of what the company does." type="textarea" isEditing={isEditing} value={data?.short_description} onChange={(val: string) => onChange({ short_description: val })} />
    </div>
  );
}

function AudienceSection({ isEditing, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <Field label="Who is this brand creating for?" description="Describe the ideal customer or viewer." type="textarea" isEditing={isEditing} value={data?.target_audience} onChange={(val: string) => onChange({ target_audience: val })} />
      <Field label="Audience Problems & Pain Points" description="What struggles do they have that the brand solves?" type="textarea" isEditing={isEditing} value={data?.audience_problems} onChange={(val: string) => onChange({ audience_problems: val })} />
      <Field label="Audience Goals" description="What is the audience trying to achieve?" type="textarea" isEditing={isEditing} value={data?.audience_goals} onChange={(val: string) => onChange({ audience_goals: val })} />
    </div>
  );
}

function VoiceSection({ isEditing, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <Field label="Tone" description="Describe how this brand should sound when it creates (e.g., Professional, confident, approachable)." isEditing={isEditing} value={data?.tone} onChange={(val: string) => onChange({ tone: val })} />
      <Field label="Writing Style" description="e.g., Short sentences, punchy, emoji-heavy." isEditing={isEditing} value={data?.writing_style} onChange={(val: string) => onChange({ writing_style: val })} />
      <Field label="Words / Phrases to Use" type="textarea" isEditing={isEditing} value={data?.words_to_use} onChange={(val: string) => onChange({ words_to_use: val })} />
      <Field label="Words / Phrases to Avoid" description="Corporate jargon, aggressive sales language, etc." type="textarea" isEditing={isEditing} value={data?.words_to_avoid} onChange={(val: string) => onChange({ words_to_avoid: val })} />
    </div>
  );
}

function StrategySection({ isEditing, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <Field label="Content Pillars" description="What subjects should this brand consistently talk about? (Comma separated)" isEditing={isEditing} value={data?.content_pillars?.join(', ')} onChange={(val: string) => onChange({ content_pillars: val.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Education, Storytelling, Behind the scenes" />
      <Field label="Content Goals" description="What is the primary goal of the content?" type="textarea" isEditing={isEditing} value={data?.content_goals} onChange={(val: string) => onChange({ content_goals: val })} />
    </div>
  );
}

function OffersSection({ isEditing, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <Field label="Products / Services" type="textarea" isEditing={isEditing} value={data?.products_services} onChange={(val: string) => onChange({ products_services: val })} />
      <Field label="Primary Offer / Call to Action" description="The main thing you want the audience to do or buy." type="textarea" isEditing={isEditing} value={data?.primary_offer} onChange={(val: string) => onChange({ primary_offer: val })} />
    </div>
  );
}

function PlatformsSection({ isEditing, data, onChange }: any) {
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'LinkedIn', 'Facebook', 'Newsletter', 'Blog'];
  const activePlatforms = data?.platforms || [];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-white mb-2">Active Platforms</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLATFORMS.map(platform => {
          const isActive = activePlatforms.includes(platform);
          return (
            <button
              key={platform}
              disabled={!isEditing}
              onClick={() => {
                if (!isEditing) return;
                const next = isActive 
                  ? activePlatforms.filter((p: string) => p !== platform)
                  : [...activePlatforms, platform];
                onChange({ platforms: next });
              }}
              className={cn(
                "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-white/5 border-white/10 text-zinc-400",
                isEditing && !isActive && "hover:bg-white/10 hover:text-white cursor-pointer",
                !isEditing && "cursor-default opacity-80"
              )}
            >
              {platform}
            </button>
          );
        })}
      </div>
      {!isEditing && activePlatforms.length === 0 && (
        <p className="text-sm text-zinc-500 mt-4 italic">No platforms selected.</p>
      )}
    </div>
  );
}

function GuidelinesSection({ isEditing, data, onChange }: any) {
  return (
    <div className="space-y-6">
      <Field label="Things the brand should ALWAYS do" type="textarea" isEditing={isEditing} value={data?.do_guidelines} onChange={(val: string) => onChange({ do_guidelines: val })} />
      <Field label="Things the brand should NEVER do" description="Compliance restrictions, visual rules, etc." type="textarea" isEditing={isEditing} value={data?.dont_guidelines} onChange={(val: string) => onChange({ dont_guidelines: val })} />
    </div>
  );
}


