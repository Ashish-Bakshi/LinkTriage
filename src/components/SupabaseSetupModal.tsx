'use client';

import React, { useState } from 'react';
import { X, Check, Copy, Database, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseSetupModal({ isOpen, onClose }: Props) {
  const { isConfigured, user, demoUser } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- LinkTriage Database Schema
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('LinkedIn', 'X', 'Instagram', 'YouTube', 'Web')),
    category VARCHAR(100) NOT NULL DEFAULT 'Tech Skills',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('Inbox', 'In Progress', 'Completed')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resources"
    ON public.resources FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Database & Sync Status</h3>
              <p className="text-xs text-slate-400">
                {isConfigured ? 'Supabase Backend Connected' : 'Running in Local Storage / Demo Mode'}
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

        <div className="overflow-y-auto py-4 space-y-5 text-sm">
          {isConfigured ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Supabase Live Sync is Active</span>
              </div>
              <p className="text-xs text-slate-300">
                Your LinkTriage instance is connected to Supabase PostgreSQL with Row Level Security (RLS) enabled. Changes synchronize across all devices in real-time.
              </p>
              {user ? (
                <div className="text-xs text-emerald-300/90 pt-1">
                  Logged in as: <span className="font-mono text-white">{user.email}</span>
                </div>
              ) : (
                <div className="text-xs text-amber-300/90 pt-1">
                  You are not currently logged in. Sign in using the Account menu to sync saved links to your user account.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Instant Demo Mode Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You can try all LinkTriage features (adding links, metadata scraping, drag & drop, filtering, PWA installation) right now! Data is saved locally in your browser storage.
              </p>
              {demoUser && (
                <div className="text-xs text-indigo-300 pt-1">
                  Active Demo Account: <span className="font-mono text-white">{demoUser.email}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="font-semibold text-white mb-2 text-sm flex items-center justify-between">
              <span>Connect to your Supabase Project</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-normal"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
              <li>
                Create a new project on <strong className="text-white">Supabase</strong>.
              </li>
              <li>
                Open the <strong className="text-white">SQL Editor</strong> and execute the table schema below:
              </li>
            </ol>

            <div className="relative mt-2">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
                {sqlCode}
              </pre>
              <button
                onClick={copySql}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex items-center gap-1 border border-slate-700 shadow"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy SQL'}
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-300">
              3. Add your environment variables in <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">.env.local</code> or Vercel:
              <pre className="mt-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-indigo-300">
                NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co&#10;NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
              </pre>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
