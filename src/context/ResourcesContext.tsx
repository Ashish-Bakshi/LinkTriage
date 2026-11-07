'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { Resource, Platform, Priority, Status, ViewMode, FilterOptions } from '@/types';
import { INITIAL_MOCK_RESOURCES, DEFAULT_CATEGORIES } from '@/lib/supabase/mock-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

interface ResourcesContextType {
  resources: Resource[];
  filteredResources: Resource[];
  isLoading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  categories: string[];
  addCategory: (category: string) => void;
  addResource: (data: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => Promise<Resource>;
  updateResource: (id: string, updates: Partial<Resource>) => Promise<void>;
  updateStatus: (id: string, newStatus: Status) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  refreshResources: () => Promise<void>;
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'linktriage_saved_resources';
const CATEGORIES_KEY = 'linktriage_categories';

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    platform: 'All',
    category: 'All',
    priority: 'All',
  });

  // Load custom categories from localStorage
  useEffect(() => {
    try {
      const savedCats = localStorage.getItem(CATEGORIES_KEY);
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
          setCategories(merged);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch or initialize resources
  const fetchResources = async () => {
    setIsLoading(true);

    if (isConfigured && user) {
      const supabase = createClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            setResources(data as Resource[]);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Supabase query error, falling back to local cache:', err);
        }
      }
    }

    // Local / Demo Mode fallback
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setResources(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default seed
    setResources(INITIAL_MOCK_RESOURCES);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RESOURCES));
    } catch {
      // ignore
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, [user, isConfigured]);

  // Real-time synchronization with Supabase
  useEffect(() => {
    if (!isConfigured || !user) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel('public:resources')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRes = payload.new as Resource;
            setResources((prev) => {
              if (prev.some((r) => r.id === newRes.id)) return prev;
              return [newRes, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Resource;
            setResources((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldRes = payload.old as { id: string };
            setResources((prev) => prev.filter((r) => r.id !== oldRes.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured, user]);

  // Persist to localStorage whenever resources change in demo/local mode
  const persistLocally = (newList: Resource[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const addCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...categories, trimmed];
    setCategories(updated);
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const addResource = async (data: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> => {
    const now = new Date().toISOString();
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;
    const newResource: Resource = {
      ...data,
      id: tempId,
      created_at: now,
      updated_at: now,
    };

    // Optimistic UI update
    setResources((prev) => {
      const next = [newResource, ...prev];
      persistLocally(next);
      return next;
    });

    if (isConfigured && user) {
      const supabase = createClient();
      if (supabase) {
        try {
          const { data: inserted, error } = await supabase
            .from('resources')
            .insert({
              url: data.url,
              title: data.title,
              source_platform: data.source_platform,
              category: data.category,
              priority: data.priority,
              status: data.status,
              description: data.description || null,
              image_url: data.image_url || null,
              user_id: user.id,
            })
            .select()
            .single();

          if (!error && inserted) {
            // Replace temporary item with DB item
            setResources((prev) => {
              const updated = prev.map((r) => (r.id === tempId ? (inserted as Resource) : r));
              persistLocally(updated);
              return updated;
            });
            return inserted as Resource;
          }
        } catch (err) {
          console.error('Failed to insert resource in Supabase:', err);
        }
      }
    }

    return newResource;
  };

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    const now = new Date().toISOString();
    setResources((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: now } : r));
      persistLocally(next);
      return next;
    });

    if (isConfigured && user) {
      const supabase = createClient();
      if (supabase) {
        try {
          await supabase
            .from('resources')
            .update({
              ...updates,
              updated_at: now,
            })
            .eq('id', id);
        } catch (err) {
          console.error('Failed to update resource in Supabase:', err);
        }
      }
    }
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    await updateResource(id, { status: newStatus });
  };

  const deleteResource = async (id: string) => {
    // Optimistic update
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistLocally(next);
      return next;
    });

    if (isConfigured && user) {
      const supabase = createClient();
      if (supabase) {
        try {
          await supabase.from('resources').delete().eq('id', id);
        } catch (err) {
          console.error('Failed to delete resource in Supabase:', err);
        }
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      platform: 'All',
      category: 'All',
      priority: 'All',
    });
  };

  // Compute filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      // Platform filter
      if (filters.platform !== 'All' && res.source_platform !== filters.platform) {
        return false;
      }
      // Category filter
      if (filters.category !== 'All' && res.category !== filters.category) {
        return false;
      }
      // Priority filter
      if (filters.priority !== 'All' && res.priority !== filters.priority) {
        return false;
      }
      // Search term
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const inTitle = res.title?.toLowerCase().includes(query) ?? false;
        const inDesc = res.description?.toLowerCase().includes(query) ?? false;
        const inUrl = res.url?.toLowerCase().includes(query) ?? false;
        const inCat = res.category?.toLowerCase().includes(query) ?? false;
        return inTitle || inDesc || inUrl || inCat;
      }
      return true;
    });
  }, [resources, filters]);

  return (
    <ResourcesContext.Provider
      value={{
        resources,
        filteredResources,
        isLoading,
        viewMode,
        setViewMode,
        filters,
        setFilters,
        resetFilters,
        categories,
        addCategory,
        addResource,
        updateResource,
        updateStatus,
        deleteResource,
        refreshResources: fetchResources,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
}

export function useResources() {
  const context = useContext(ResourcesContext);
  if (!context) {
    throw new Error('useResources must be used within a ResourcesProvider');
  }
  return context;
}
