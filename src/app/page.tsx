'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TableView } from '@/components/TableView';
import { QuickAddModal, QuickAddFAB } from '@/components/QuickAddModal';
import { EditResourceModal } from '@/components/EditResourceModal';
import { AuthModal } from '@/components/AuthModal';
import { SupabaseSetupModal } from '@/components/SupabaseSetupModal';
import { useResources } from '@/context/ResourcesContext';
import { Resource } from '@/types';
import {
  Inbox,
  AlertCircle,
  CheckCircle2,
  Flag,
  Plus,
} from 'lucide-react';

export default function HomePage() {
  const { resources, viewMode } = useResources();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Check query params for PWA action shortcuts (e.g., /?action=quick-add)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'quick-add') {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => setIsQuickAddOpen(true), 0);
      }
    }
  }, []);

  // Compute summary metrics
  const inboxCount = resources.filter((r) => r.status === 'Inbox').length;
  const inProgressCount = resources.filter((r) => r.status === 'In Progress').length;
  const completedCount = resources.filter((r) => r.status === 'Completed').length;
  const highPriorityCount = resources.filter((r) => r.priority === 'High' && r.status !== 'Completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navigation */}
      <Navbar
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSetup={() => setIsSetupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
                  Triaging Workflow
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Acquisition &amp; Resources: Categorize, prioritize, and track social links.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Save educational insights, growth frameworks, and technical blueprints from LinkedIn, X, Instagram Reels, and articles into actionable execution.
              </p>
            </div>

            {/* Quick Add CTA on desktop */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Save Link</span>
              </button>
            </div>
          </div>

          {/* Metric Stats Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-5">
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{inboxCount}</div>
                <div className="text-[11px] text-slate-400 font-medium">Inbox / To-Do</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{inProgressCount}</div>
                <div className="text-[11px] text-slate-400 font-medium">In Progress</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{completedCount}</div>
                <div className="text-[11px] text-slate-400 font-medium">Completed</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{highPriorityCount}</div>
                <div className="text-[11px] text-slate-400 font-medium">High Priority</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Strip */}
        <FilterBar />

        {/* Board or Table View */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            onEdit={(resource) => setEditingResource(resource)}
            onQuickAdd={() => setIsQuickAddOpen(true)}
          />
        ) : (
          <TableView onEdit={(resource) => setEditingResource(resource)} />
        )}
      </main>

      {/* Floating Action Button (FAB) for mobile & persistent quick access */}
      <QuickAddFAB onClick={() => setIsQuickAddOpen(true)} />

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      <EditResourceModal
        resource={editingResource}
        isOpen={Boolean(editingResource)}
        onClose={() => setEditingResource(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <SupabaseSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />
    </div>
  );
}
