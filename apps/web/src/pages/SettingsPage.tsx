import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bell, Shield, Database, Trash2, Save, Loader2, Key, Eye, EyeOff } from 'lucide-react';

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
      <div className="p-6 rounded-[18px] bg-[#111111] border border-white/[0.06] space-y-5">{children}</div>
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('users').update({ full_name: name }).eq('id', user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[24px] font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] text-[#FAFAFA] mb-1">Profile picture</p>
            <p className="text-[12px] text-[#71717A]">Avatar upload coming soon. Using initial for now.</p>
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
          <button onClick={() => toggle(key as keyof typeof prefs)}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${val ? 'bg-primary' : 'bg-white/[0.12]'}`}>
            <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform ${val ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
          </button>
        </Field>
      ))}
    </Section>
  );
}

// ---- Security Tab ------------------------------------------
function SecurityTab() {
  const [showKey, setShowKey] = useState(false);
  const apiKey = `cos_sk_${Math.random().toString(36).slice(2, 18)}`;

  return (
    <div className="space-y-6">
      <Section title="API Access">
        <Field label="Your API Key" hint="Use this to access Creator OS from external tools">
          <div className="flex items-center gap-2">
            <Input value={showKey ? apiKey : '••••••••••••••••••••'} readOnly
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] font-mono text-[12px]" />
            <Button variant="ghost" size="icon" onClick={() => setShowKey(v => !v)}
              className="h-10 w-10 rounded-[10px] border border-white/[0.08] text-[#71717A] hover:text-[#FAFAFA]">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </Field>
      </Section>

      <Section title="Danger Zone">
        <div className="flex items-center justify-between">
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
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Settings</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Manage your account and workspace.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-[12px] bg-[#111111] border border-white/[0.06] w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-[#71717A] hover:text-[#FAFAFA]'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
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
