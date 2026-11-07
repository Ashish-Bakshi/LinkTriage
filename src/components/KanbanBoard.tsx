'use client';

import React, { useState } from 'react';
import { Resource, Status } from '@/types';
import { useResources } from '@/context/ResourcesContext';
import { ResourceCard } from './ResourceCard';
import { Plus } from 'lucide-react';
import { getStatusInfo } from '@/lib/ui-helpers';

interface Props {
  onEdit: (resource: Resource) => void;
  onQuickAdd: () => void;
}

const COLUMNS: Status[] = ['Inbox', 'In Progress', 'Completed'];

export function KanbanBoard({ onEdit, onQuickAdd }: Props) {
  const { filteredResources, updateStatus } = useResources();
  const [activeMobileColumn, setActiveMobileColumn] = useState<Status>('Inbox');
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  const getResourcesByStatus = (status: Status) => {
    return filteredResources.filter((r) => r.status === status);
  };

  const handleDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setDragOverCol(null);
    const resourceId = e.dataTransfer.getData('text/plain');
    if (resourceId) {
      updateStatus(resourceId, status);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Column Switcher (Visible only on mobile screens < md) */}
      <div className="flex md:hidden p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3">
        {COLUMNS.map((col) => {
          const count = getResourcesByStatus(col).length;
          const isActive = activeMobileColumn === col;
          return (
            <button
              key={col}
              onClick={() => setActiveMobileColumn(col)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{col}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((status) => {
          const items = getResourcesByStatus(status);
          const statusInfo = getStatusInfo(status);
          const isDragTarget = dragOverCol === status;
          const isMobileVisible = activeMobileColumn === status;

          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex flex-col rounded-2xl bg-slate-900/40 border transition-all duration-200 p-3.5 min-h-[500px] ${
                isDragTarget
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800/80 hover:border-slate-700/60'
              } ${isMobileVisible ? 'flex' : 'hidden md:flex'}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${statusInfo.bg}`}>
                    {statusInfo.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      {statusInfo.label}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/50">
                    {items.length}
                  </span>
                  <button
                    onClick={onQuickAdd}
                    title={`Add link to ${status}`}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="h-48 border-2 border-dashed border-slate-800/70 rounded-xl flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-slate-500 mb-2">No links in {status}</p>
                    <button
                      onClick={onQuickAdd}
                      className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Link
                    </button>
                  </div>
                ) : (
                  items.map((res) => (
                    <ResourceCard key={res.id} resource={res} onEdit={onEdit} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
