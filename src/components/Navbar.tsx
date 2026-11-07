'use client';

import React from 'react';
import {
  Kanban,
  Table,
  Plus,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useResources } from '@/context/ResourcesContext';
import { useAuth } from '@/context/AuthContext';

interface Props {
  onOpenQuickAdd: () => void;
  onOpenAuth: () => void;
  onOpenSetup: () => void;
}

export function Navbar({ onOpenQuickAdd, onOpenAuth, onOpenSetup }: Props) {
  const { viewMode, setViewMode } = useResources();
  const { user, demoUser, isConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-indigo-600/30 shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-500 flex items-center justify-center text-white font-black text-base">
              LT
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Link<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Triage</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                PWA
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle: Kanban vs Table */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Structured Data Table View"
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          {/* Database / Sync Status Pill */}
          <button
            onClick={onOpenSetup}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              isConfigured
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40'
            }`}
          >
            {isConfigured ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Live</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Mode</span>
              </>
            )}
          </button>

          {/* Quick Add Button (Desktop) */}
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>

          {/* User Account / Sign In */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition"
          >
            {user || demoUser ? (
              <>
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {(user?.email || demoUser?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline max-w-[110px] truncate">
                  {user?.email || demoUser?.name || 'Account'}
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
