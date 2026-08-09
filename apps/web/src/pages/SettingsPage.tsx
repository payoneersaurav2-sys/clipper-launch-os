import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bell, Shield, Database, Trash2, Save, Loader2, Camera } from 'lucide-react';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'workspace',     label: 'Workspace',      icon: Database },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'security',      label: 'Security',       icon: Shield },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[13px] font-semibold text-[#A1A1AA] uppercase tracking-widest">{title}</h3>
      <div className="os-panel p-5 sm:p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="md:w-48 shrink-0">
        <p className="text-[13px] font-medium text-[#FAFAFA]">{label}</p>
        {hint && <p className="text-[11px] text-[#71717A] mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ---- Profile Tab -------------------------------------------
function ProfileTab() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.email?.split('@')[0] ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('users').update({ full_name: name }).eq('id', user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setAvatarError('Choose an image under 5 MB.');
      return;
    }
    setAvatarError(null);
    setSaving(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
    if (uploadError) {
      setAvatarError('We could not upload your avatar. Please try again.');
      setSaving(false);
      return;
    }
    const { data } = supabase.storage.from('user-avatars').getPublicUrl(path);
    const nextUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase.from('users').update({ avatar_url: nextUrl }).eq('id', user.id);
    if (updateError) setAvatarError('Your image uploaded, but we could not save it to your profile.');
    else {
      setAvatarUrl(nextUrl);
      useAuthStore.setState({ avatarUrl: nextUrl });
    }
    setSaving(false);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <Section title="Personal Information">
        <Field label="Display Name" hint="Shown across your workspace">
          <Input value={name} onChange={e => setName(e.target.value)}
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] focus:border-primary/50" />
        </Field>
        <Field label="Email" hint="Cannot be changed here">
          <Input value={user?.email ?? ''} disabled
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.04] text-[#71717A] cursor-not-allowed" />
        </Field>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-primary/30 bg-primary/20 flex items-center justify-center text-[24px] font-bold text-primary">
            {avatarUrl ? <img src={avatarUrl} alt="Your profile avatar" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] text-[#FAFAFA] mb-1">Profile picture</p>
            <p className="text-[12px] text-[#71717A]">JPG, PNG, WebP, or GIF up to 5 MB.</p>
            <input ref={avatarInput} onChange={handleAvatar} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" />
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => avatarInput.current?.click()} className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80"><Camera className="mr-1.5 h-3.5 w-3.5" />Change photo</Button>
            {avatarError && <p className="mt-2 text-xs text-[#D4D4D8]">{avatarError}</p>}
          </div>
        </div>
      </Section>

      <Button onClick={handleSave} disabled={saving}
        className="h-10 rounded-[10px] px-5 bg-primary text-white hover:bg-primary/90 text-[13px]">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        {saved ? 'Saved!' : 'Save Changes'}
      </Button>
    </div>
  );
}

// ---- Workspace Tab -----------------------------------------
function WorkspaceTab() {
  const { activeWorkspace } = useWorkspaceStore();
  const [name, setName] = useState(activeWorkspace?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeWorkspace) return;
    setSaving(true);
    await supabase.from('workspaces').update({ name }).eq('id', activeWorkspace.id);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Section title="Workspace Settings">
        <Field label="Workspace Name">
          <Input value={name} onChange={e => setName(e.target.value)}
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] focus:border-primary/50" />
        </Field>
        <Field label="Workspace ID" hint="Read-only">
          <Input value={activeWorkspace?.id ?? '—'} disabled
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.04] text-[#71717A] font-mono text-[12px] cursor-not-allowed" />
        </Field>
      </Section>
      <Button onClick={handleSave} disabled={saving} className="h-10 rounded-[10px] px-5 bg-primary text-white text-[13px]">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Workspace
      </Button>
    </div>
  );
}

// ---- Notifications Tab -------------------------------------
function NotificationsTab() {
  const [prefs, setPrefs] = useState({ ai: true, campaign: true, billing: true, team: false });
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  return (
    <Section title="Notification Preferences">
      {Object.entries(prefs).map(([key, val]) => (
        <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1) + ' notifications'}
          hint={key === 'ai' ? 'When AI finishes generating' : key === 'campaign' ? 'Campaign status changes' : key === 'billing' ? 'Renewal and payment alerts' : 'Team invitations and changes'}>
          <button onClick={() => toggle(key as keyof typeof prefs)} aria-pressed={val} aria-label={`${key} notifications ${val ? 'enabled' : 'disabled'}`}
            className={`relative w-11 h-[24px] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${val ? 'bg-primary' : 'bg-white/[0.12]'}`}>
            <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform ${val ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
          </button>
        </Field>
      ))}
    </Section>
  );
}

// ---- Security Tab ------------------------------------------
function SecurityTab() {
  return (
    <div className="space-y-6">
      <Section title="API Access">
        <Field label="API Access" hint="Server-issued API keys are not available yet.">
          <div className="flex items-center gap-2">
            <Input value="Not available" readOnly disabled
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#71717A] font-mono text-[12px]" />
          </div>
        </Field>
      </Section>

      <Section title="Danger Zone">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-red-400">Delete Account</p>
            <p className="text-[12px] text-[#71717A]">Permanently delete your account and all data.</p>
          </div>
          <Button variant="outline" className="h-9 rounded-[10px] border-red-500/30 bg-red-500/[0.06] text-red-400 hover:bg-red-500/10 text-[12px]">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete Account
          </Button>
        </div>
      </Section>
    </div>
  );
}

// ---- Main page ---------------------------------------------
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="os-page max-w-3xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Settings</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Manage your account and workspace.</p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1" role="tablist" aria-label="Settings sections">
        <div className="flex gap-1 p-1 rounded-[12px] bg-[#111111] border border-white/[0.06] w-fit min-w-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-[10px] text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-[#71717A] hover:text-[#FAFAFA]'}`}>
            <tab.icon className="h-4 w-4 shrink-0" /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === 'profile'       && <ProfileTab />}
          {activeTab === 'workspace'     && <WorkspaceTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'security'      && <SecurityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
