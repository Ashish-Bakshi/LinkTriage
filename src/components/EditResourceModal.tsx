'use client';

import React, { useState } from 'react';
import { X, Check, Trash2, Tag, Flag, Layers, Link as LinkIcon } from 'lucide-react';
import { Resource, Platform, Priority, Status } from '@/types';
import { useResources } from '@/context/ResourcesContext';
import { getPlatformInfo } from '@/lib/ui-helpers';

interface Props {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS: Platform[] = ['LinkedIn', 'X', 'Instagram', 'YouTube', 'Web'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Inbox', 'In Progress', 'Completed'];

function EditForm({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  const { updateResource, deleteResource, categories } = useResources();

  const [title, setTitle] = useState(resource.title);
  const [url, setUrl] = useState(resource.url);
  const [description, setDescription] = useState(resource.description || '');
  const [platform, setPlatform] = useState<Platform>(resource.source_platform);
  const [category, setCategory] = useState<string>(resource.category);
  const [priority, setPriority] = useState<Priority>(resource.priority);
  const [status, setStatus] = useState<Status>(resource.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateResource(resource.id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        source_platform: platform,
        category,
        priority,
        status,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update resource:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this resource?')) {
      await deleteResource(resource.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4 text-xs">
      <div>
        <label className="block font-semibold text-slate-200 mb-1.5">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-200 mb-1.5">Target Link</label>
        <div className="relative">
          <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

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
                    ? 'border-indigo-500 bg-indigo-500/20 text-white'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="mb-1">{info.icon}</span>
                <span>{p}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            Category
          </label>
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
        </div>

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

      <div>
        <label className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          Kanban Column Status
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

      <div>
        <label className="block font-semibold text-slate-200 mb-1.5">Notes / Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
        />
      </div>

      <div className="pt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
}

export function EditResourceModal({ resource, isOpen, onClose }: Props) {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Edit Resource</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <EditForm key={resource.id} resource={resource} onClose={onClose} />
      </div>
    </div>
  );
}
