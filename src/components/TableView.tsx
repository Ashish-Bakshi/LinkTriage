'use client';

import React from 'react';
import { Resource, Status } from '@/types';
import { useResources } from '@/context/ResourcesContext';
import { getPlatformInfo, getPriorityInfo, formatRelativeTime } from '@/lib/ui-helpers';
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';

interface Props {
  onEdit: (resource: Resource) => void;
}

const STATUSES: Status[] = ['Inbox', 'In Progress', 'Completed'];

export function TableView({ onEdit }: Props) {
  const { filteredResources, updateStatus, deleteResource } = useResources();

  const handleStatusChange = (id: string, newStatus: Status) => {
    updateStatus(id, newStatus);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this resource?')) {
      deleteResource(id);
    }
  };

  if (filteredResources.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <p className="text-slate-400 text-sm">No resources match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
            <th className="py-3 px-4 min-w-[260px]">Resource</th>
            <th className="py-3 px-3">Platform</th>
            <th className="py-3 px-3">Category</th>
            <th className="py-3 px-3">Priority</th>
            <th className="py-3 px-3 min-w-[140px]">Status</th>
            <th className="py-3 px-3">Saved</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {filteredResources.map((res) => {
            const platformInfo = getPlatformInfo(res.source_platform);
            const priorityInfo = getPriorityInfo(res.priority);

            return (
              <tr
                key={res.id}
                className="hover:bg-slate-800/40 transition group"
              >
                {/* Title & URL */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-white hover:text-indigo-300 transition">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>{res.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 inline" />
                    </a>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-sm font-mono mt-0.5">
                    {res.url}
                  </div>
                </td>

                {/* Platform */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${platformInfo.badgeClass}`}
                  >
                    {platformInfo.icon}
                    <span>{platformInfo.label}</span>
                  </span>
                </td>

                {/* Category */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {res.category}
                  </span>
                </td>

                {/* Priority */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityInfo.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
                    <span>{res.priority}</span>
                  </span>
                </td>

                {/* Status Column with quick select */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <select
                    value={res.status}
                    onChange={(e) => handleStatusChange(res.id, e.target.value as Status)}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Date */}
                <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                  {formatRelativeTime(res.created_at)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(res)}
                      title="Edit resource"
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      title="Delete resource"
                      className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
