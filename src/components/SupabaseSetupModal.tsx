'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  Database,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CloudUpload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useResources } from '@/context/ResourcesContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseSetupModal({ isOpen, onClose }: Props) {
  const { isConfigured, user } = useAuth();
  const {
    syncStatus,
    syncError,
    syncLocalToSupabase,
    refreshResources,
    resources,
  } = useResources();

  const [copiedFix, setCopiedFix] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'fix' | 'full'>('fix');

  if (!isOpen) return null;

  const fixSqlCode = `-- ==============================================================================
-- LinkTriage: 1-Click Fix for Supabase Cloud Sync
-- 1. Make user_id optional (allows direct saving without mandatory login)
-- 2. Add missing image_url column
-- 3. Allow anonymous & authenticated CRUD operations
-- ==============================================================================
ALTER TABLE public.resources ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS image_url TEXT;

DROP POLICY IF EXISTS "Users can manage own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON public.resources;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.resources;

CREATE POLICY "Enable all access for all users"
    ON public.resources
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);`;

  const fullSchemaCode = `-- ==============================================================================
-- LinkTriage: Full PostgreSQL Database Schema for Supabase
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('LinkedIn', 'X', 'Instagram', 'YouTube', 'Web')),
    category VARCHAR(100) NOT NULL DEFAULT 'Tech Skills',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('Inbox', 'In Progress', 'Completed')),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.resources ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_priority ON public.resources(priority);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for all users" ON public.resources;
CREATE POLICY "Enable all access for all users"
    ON public.resources
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;`;

  const copyFix = () => {
    navigator.clipboard.writeText(fixSqlCode);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const copyFull = () => {
    navigator.clipboard.writeText(fullSchemaCode);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleTestAndSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncLocalToSupabase();
      if (res.success) {
        setSyncMsg(`Successfully synced ${res.count} items to Supabase cloud!`);
      } else {
        setSyncMsg(`Sync check: ${res.error || 'Check Supabase RLS policy.'}`);
      }
    } catch (err: unknown) {
      setSyncMsg(`Sync error: ${err instanceof Error ? err.message : 'Failed'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isConfigured && syncStatus === 'synced'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isConfigured && syncStatus === 'local_only'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Database &amp; Sync Status</h3>
              <p className="text-xs text-slate-400">
                {isConfigured
                  ? syncStatus === 'synced'
                    ? 'Connected and synchronized with Supabase'
                    : 'Supabase configured, local fallback active'
                  : 'Local browser storage sandbox'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs">
          {/* Status Alert Banner */}
          {isConfigured ? (
            syncStatus === 'synced' ? (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Supabase Cloud Sync is Live &amp; Working</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  All saved links and status changes are synchronizing directly to your Supabase PostgreSQL database in real-time. Changes persist across all devices and browser refreshes.
                </p>
                <div className="text-slate-400 text-[11px] pt-1">
                  Total items in workspace: <span className="font-bold text-white">{resources.length}</span>
                  {user && (
                    <span className="ml-2">
                      &bull; User: <span className="font-mono text-emerald-300">{user.email}</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Saved Locally &bull; Supabase RLS Fix Needed</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Your links are <strong className="text-white">safely preserved in local storage</strong> and will <strong className="text-white">NOT be lost on refresh</strong>. To enable automatic saving directly to your Supabase cloud database, apply the 1-click SQL fix below.
                </p>
                {syncError && (
                  <div className="p-2 bg-slate-950/80 rounded border border-amber-500/20 font-mono text-[10px] text-amber-300/90 break-all">
                    Supabase notice: {syncError}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Local Storage Sandbox Active</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                LinkTriage is operating in local storage mode. Links you save are kept in your browser. Add your Supabase credentials to <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">.env.local</code> to enable multi-device cloud synchronization.
              </p>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setTab('fix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'fix'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              1-Click Supabase Fix SQL
            </button>
            <button
              onClick={() => setTab('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'full'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              Full Fresh Table Schema
            </button>
          </div>

          {/* Tab 1: 1-Click Fix */}
          {tab === 'fix' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">
                  Run in Supabase &rarr; SQL Editor:
                </span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                  {fixSqlCode}
                </pre>
                <button
                  onClick={copyFix}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs flex items-center gap-1 shadow font-medium"
                >
                  {copiedFix ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFix ? 'Copied!' : 'Copy Fix SQL'}
                </button>
              </div>

              {/* Sync Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-300">
                  Ran the SQL in Supabase? Test and sync your local links now:
                </div>
                <button
                  onClick={handleTestAndSync}
                  disabled={syncing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  {syncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>{syncing ? 'Syncing...' : 'Sync to Supabase'}</span>
                </button>
              </div>

              {syncMsg && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-medium text-emerald-400">
                  {syncMsg}
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Full Fresh Schema */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">Full Schema Definition:</span>
                <button
                  onClick={copyFull}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex items-center gap-1 border border-slate-700 font-medium"
                >
                  {copiedFull ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedFull ? 'Copied' : 'Copy Schema'}
                </button>
              </div>
              <div className="relative">
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44">
                  {fullSchemaCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => refreshResources()}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Data
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
