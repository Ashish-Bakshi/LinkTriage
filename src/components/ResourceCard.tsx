'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
} from 'lucide-react';
import { Resource, Status } from '@/types';
import { useResources } from '@/context/ResourcesContext';
import { getPlatformInfo, getPriorityInfo, formatRelativeTime } from '@/lib/ui-helpers';

interface Props {
  resource: Resource;
  onEdit: (resource: Resource) => void;
}

export function ResourceCard({ resource, onEdit }: Props) {
  const { updateStatus, deleteResource } = useResources();
  const [copied, setCopied] = useState(false);

  const platformInfo = getPlatformInfo(resource.source_platform);
  const priorityInfo = getPriorityInfo(resource.priority);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', resource.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMove = (newStatus: Status, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus(resource.id, newStatus);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this resource?')) {
      deleteResource(resource.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-200 cursor-grab active:cursor-grabbing border-l-4 ${priorityInfo.borderAccent}`}
    >
      {/* Top row: Platform & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${platformInfo.badgeClass}`}
          >
            {platformInfo.icon}
            <span>{platformInfo.label}</span>
          </span>

          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {resource.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityInfo.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
            <span>{resource.priority}</span>
          </span>
          <div className="text-slate-600 group-hover:text-slate-400 transition hidden sm:block">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Resource Title */}
      <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 hover:text-indigo-300 transition mb-1.5">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="hover:underline flex items-start gap-1"
        >
          <span>{resource.title}</span>
          <ExternalLink className="w-3.5 h-3.5 inline-block shrink-0 mt-0.5 text-slate-400 group-hover:text-indigo-400" />
        </a>
      </h4>

      {/* Description / Excerpt */}
      {resource.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {resource.description}
        </p>
      )}

      {/* Footer Info & Actions */}
      <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px] text-slate-400 font-medium">
          {formatRelativeTime(resource.created_at)}
        </span>

        <div className="flex items-center gap-1">
          {/* Quick Copy Link */}
          <button
            onClick={handleCopy}
            title={copied ? 'Copied URL!' : 'Copy link'}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(resource);
            }}
            title="Edit resource"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            title="Delete resource"
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Move Status Buttons (1-Tap mobile triage) */}
      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-800 flex items-center justify-between gap-1 text-[11px]">
        {resource.status === 'Inbox' && (
          <button
            onClick={(e) => handleMove('In Progress', e)}
            className="w-full py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium flex items-center justify-center gap-1 transition"
          >
            <span>Move to In Progress</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {resource.status === 'In Progress' && (
          <>
            <button
              onClick={(e) => handleMove('Inbox', e)}
              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Inbox</span>
            </button>
            <button
              onClick={(e) => handleMove('Completed', e)}
              className="py-1 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-medium flex items-center gap-1 transition ml-auto"
            >
              <span>Complete</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </>
        )}

        {resource.status === 'Completed' && (
          <button
            onClick={(e) => handleMove('In Progress', e)}
            className="w-full py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center justify-center gap-1 transition"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Reopen to In Progress</span>
          </button>
        )}
      </div>
    </div>
  );
}
