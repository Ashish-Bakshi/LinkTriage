'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Platform, Priority } from '@/types';
import { useResources } from '@/context/ResourcesContext';
import { getPlatformInfo } from '@/lib/ui-helpers';

const PLATFORMS: (Platform | 'All')[] = ['All', 'LinkedIn', 'X', 'Instagram', 'YouTube', 'Web'];
const PRIORITIES: (Priority | 'All')[] = ['All', 'High', 'Medium', 'Low'];

export function FilterBar() {
  const { filters, setFilters, resetFilters, categories, resources, filteredResources } = useResources();

  const isFiltered =
    filters.search.trim() !== '' ||
    filters.platform !== 'All' ||
    filters.category !== 'All' ||
    filters.priority !== 'All';

  return (
    <div className="space-y-3 mb-6">
      {/* Top Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search saved resources, topics, or links..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns for Category & Priority */}
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value as Priority | 'All' }))}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Priorities' : `${p} Priority`}
              </option>
            ))}
          </select>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Platform Filter Pills (Horizontal scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {PLATFORMS.map((p) => {
          const isSelected = filters.platform === p;
          const count =
            p === 'All'
              ? resources.length
              : resources.filter((r) => r.source_platform === p).length;

          const info = p === 'All' ? null : getPlatformInfo(p);

          return (
            <button
              key={p}
              onClick={() => setFilters((prev) => ({ ...prev, platform: p }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap transition font-medium text-xs ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {info && <span className="shrink-0">{info.icon}</span>}
              <span>{p}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {isFiltered && (
          <span className="ml-auto text-[11px] text-slate-400 hidden lg:inline">
            Showing {filteredResources.length} of {resources.length} resources
          </span>
        )}
      </div>
    </div>
  );
}
