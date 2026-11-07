'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Link as LinkIcon,
  Clipboard,
  Check,
  AlertCircle,
  Tag,
  Flag,
  Layers,
} from 'lucide-react';
import { Platform, Priority, Status } from '@/types';
import { useResources } from '@/context/ResourcesContext';
import { getPlatformInfo } from '@/lib/ui-helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS: Platform[] = ['LinkedIn', 'X', 'Instagram', 'YouTube', 'Web'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Inbox', 'In Progress', 'Completed'];

export function QuickAddModal({ isOpen, onClose }: Props) {
  const { addResource, categories, addCategory } = useResources();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<Platform>('Web');
  const [category, setCategory] = useState<string>(categories[0] || 'Client Acquisition');
  const [priority, setPriority] = useState<Priority>('High');
  const [status, setStatus] = useState<Status>('Inbox');

  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setPlatform('Web');
      setCategory(categories[0] || 'Client Acquisition');
      setPriority('High');
      setStatus('Inbox');
      setIsScraping(false);
      setScrapeError(null);
      setShowNewCatInput(false);
      setNewCatInput('');
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleScrape = async (targetUrl: string) => {
    if (!targetUrl || targetUrl.length < 8) return;
    try {
      setIsScraping(true);
      setScrapeError(null);

      const res = await fetch('/api/scrape-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch link metadata');
      }

      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
      }
      if (data.description) {
        setDescription(data.description);
      }
      if (data.platform) {
        setPlatform(data.platform);
      }
    } catch {
      setScrapeError('Could not auto-scrape title. You can type it manually.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    // Auto-scrape when a valid url is pasted
    if (value.startsWith('http://') || value.startsWith('https://')) {
      handleScrape(value);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleUrlChange(text.trim());
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreateCategory = () => {
    if (newCatInput.trim()) {
      addCategory(newCatInput.trim());
      setCategory(newCatInput.trim());
      setNewCatInput('');
      setShowNewCatInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    try {
      await addResource({
        url: url.trim(),
        title: title.trim() || url.trim(),
        description: description.trim() || undefined,
        source_platform: platform,
        category: category || 'Client Acquisition',
        priority,
        status,
      });
      onClose();
    } catch (err) {
      console.error('Failed to add resource:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Save & Triage Resource</h3>
              <p className="text-xs text-slate-400">Quickly capture links from LinkedIn, X, IG, YouTube or Web</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                Resource URL <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Clipboard className="w-3 h-3" />
                Paste from Clipboard
              </button>
            </div>
            <div className="relative">
              <input
                type="url"
                required
                autoFocus
                placeholder="https://linkedin.com/posts/... or https://x.com/..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full pl-3 pr-24 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {isScraping && (
                <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 text-[11px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Extracting...</span>
                </div>
              )}
            </div>
            {scrapeError && (
              <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {scrapeError}
              </p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Title / Resource Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5 B2B Outbound Cold Email Hooks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">Platform</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => {
                const info = getPlatformInfo(p);
                const isSelected = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="mb-1">{info.icon}</span>
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  {showNewCatInput ? 'Cancel' : '+ New'}
                </button>
              </div>

              {showNewCatInput ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-indigo-400" />
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p;
                  let colorClass = 'text-slate-400 border-slate-800 bg-slate-950/70';
                  if (isSelected) {
                    if (p === 'High') colorClass = 'border-red-500/50 bg-red-500/20 text-red-300 font-bold';
                    if (p === 'Medium') colorClass = 'border-amber-500/50 bg-amber-500/20 text-amber-300 font-bold';
                    if (p === 'Low') colorClass = 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-bold';
                  }

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-2 rounded-xl border text-[11px] transition text-center ${colorClass}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Column Selection */}
          <div>
            <label className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Target Kanban Column
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((st) => {
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition text-center ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description / Notes (Optional) */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Notes / Key Takeaways <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Why this link is important, key action items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:from-indigo-700 active:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Save Resource to {status}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QuickAddFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white rounded-full shadow-2xl shadow-indigo-600/50 transition-all font-semibold text-sm group"
      aria-label="Quick Add Resource"
    >
      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
      <span className="hidden sm:inline">Add Resource</span>
    </button>
  );
}
