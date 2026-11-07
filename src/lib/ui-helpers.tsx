import React from 'react';
import { Platform, Priority, Status } from '@/types';
import { Globe, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { LinkedInIcon, XIcon, InstagramIcon, YouTubeIcon } from '@/components/PlatformIcons';

export function getPlatformInfo(platform: Platform) {
  switch (platform) {
    case 'LinkedIn':
      return {
        label: 'LinkedIn',
        icon: <LinkedInIcon className="w-3.5 h-3.5 text-[#0a66c2]" />,
        badgeClass: 'bg-[#0a66c2]/10 text-[#70b5f9] border-[#0a66c2]/30',
        color: '#0a66c2',
      };
    case 'X':
      return {
        label: 'X',
        icon: <XIcon className="w-3.5 h-3.5 text-white" />,
        badgeClass: 'bg-slate-800 text-slate-100 border-slate-700',
        color: '#ffffff',
      };
    case 'Instagram':
      return {
        label: 'Instagram',
        icon: <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />,
        badgeClass: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
        color: '#e1306c',
      };
    case 'YouTube':
      return {
        label: 'YouTube',
        icon: <YouTubeIcon className="w-3.5 h-3.5 text-red-400" />,
        badgeClass: 'bg-red-500/10 text-red-300 border-red-500/30',
        color: '#ff0000',
      };
    case 'Web':
    default:
      return {
        label: 'Web',
        icon: <Globe className="w-3.5 h-3.5 text-indigo-400" />,
        badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
        color: '#6366f1',
      };
  }
}

export function getPriorityInfo(priority: Priority) {
  switch (priority) {
    case 'High':
      return {
        label: 'High Priority',
        badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
        dotClass: 'bg-red-500 shadow-red-500/50 shadow-sm animate-pulse',
        borderAccent: 'border-l-red-500',
      };
    case 'Medium':
      return {
        label: 'Medium Priority',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        borderAccent: 'border-l-amber-500',
      };
    case 'Low':
      return {
        label: 'Low Priority',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        borderAccent: 'border-l-emerald-500',
      };
  }
}

export function getStatusInfo(status: Status) {
  switch (status) {
    case 'Inbox':
      return {
        label: 'Inbox / To-Do',
        icon: <Clock className="w-4 h-4 text-cyan-400" />,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
      };
    case 'In Progress':
      return {
        label: 'In Progress',
        icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
      };
    case 'Completed':
      return {
        label: 'Completed',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
      };
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}
