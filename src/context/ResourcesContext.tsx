'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react';
import { Resource, Status, ViewMode, FilterOptions } from '@/types';
import { INITIAL_MOCK_RESOURCES, DEFAULT_CATEGORIES } from '@/lib/supabase/mock-data';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

export type SyncStatus = 'synced' | 'local_only' | 'syncing' | 'error';

interface ResourcesContextType {
  resources: Resource[];
  filteredResources: Resource[];
  isLoading: boolean;
  isHydrated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
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
  syncLocalToSupabase: () => Promise<{ success: boolean; count: number; error?: string }>;
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'linktriage_saved_resources';
const CATEGORIES_KEY = 'linktriage_categories';

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [resources, setResources] = useState<Resource[]>(INITIAL_MOCK_RESOURCES);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    platform: 'All',
    category: 'All',
    priority: 'All',
  });

  // Safe helper to write to localStorage
  const persistLocally = useCallback((newList: Resource[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
    }
  }, []);

  // 1. Initial client-side hydration from localStorage (fixes "one refresh and everything gone")
  useEffect(() => {
    if (typeof window === 'undefined') return;

    Promise.resolve().then(() => {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setResources(parsed);
          }
        } else {
          // First visit: seed localStorage with default mock items
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RESOURCES));
        }
      } catch (err) {
        console.warn('Error reading local resources:', err);
      }

      try {
        const savedCats = localStorage.getItem(CATEGORIES_KEY);
        if (savedCats) {
          const parsedCats = JSON.parse(savedCats);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) {
            setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...parsedCats])));
          }
        }
      } catch (err) {
        console.warn('Error reading local categories:', err);
      }

      setIsHydrated(true);
    });
  }, []);

  // 2. Fetch resources from Supabase
  const fetchResources = useCallback(async () => {
    if (!isConfigured) {
      setSyncStatus('local_only');
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.id) {
        // Query user's resources or unassigned resources
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch failed, preserving local storage data:', error.message);
        setSyncStatus('local_only');
        setSyncError(error.message);
      } else if (data && data.length > 0) {
        const remoteList = data as Resource[];
        setResources(remoteList);
        persistLocally(remoteList);
        setSyncStatus('synced');
        setSyncError(null);
      } else if (data && data.length === 0) {
        // Remote table is empty. Keep local items so user doesn't lose anything
        setSyncStatus('synced');
        setSyncError(null);
      }
    } catch (err: unknown) {
      console.error('Supabase query exception, using local cache:', err);
      setSyncStatus('local_only');
      setSyncError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, user, persistLocally]);

  // Load from Supabase once client hydration is done and whenever auth changes
  useEffect(() => {
    let isSubscribed = true;
    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (user?.id) {
          query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        }

        query.then(({ data, error }) => {
          if (!isSubscribed) return;
          if (error) {
            setSyncStatus('local_only');
            setSyncError(error.message);
          } else if (data && data.length > 0) {
            const remoteList = data as Resource[];
            setResources(remoteList);
            persistLocally(remoteList);
            setSyncStatus('synced');
            setSyncError(null);
          } else {
            setSyncStatus('synced');
            setSyncError(null);
          }
        });
      }
    }
    return () => {
      isSubscribed = false;
    };
  }, [isConfigured, user, persistLocally]);

  // Real-time synchronization with Supabase
  useEffect(() => {
    if (!isConfigured) return;

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
              const next = [newRes, ...prev];
              persistLocally(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Resource;
            setResources((prev) => {
              const next = prev.map((r) => (r.id === updated.id ? updated : r));
              persistLocally(next);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRes = payload.old as { id: string };
            setResources((prev) => {
              const next = prev.filter((r) => r.id !== oldRes.id);
              persistLocally(next);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured, persistLocally]);

  const addCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...categories, trimmed];
    setCategories(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
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

    // 1. Optimistic UI update and immediate localStorage persistence
    setResources((prev) => {
      const next = [newResource, ...prev];
      persistLocally(next);
      return next;
    });

    // 2. Persist to Supabase if configured
    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        try {
          const insertPayload: Record<string, unknown> = {
            url: data.url,
            title: data.title,
            source_platform: data.source_platform,
            category: data.category,
            priority: data.priority,
            status: data.status,
            description: data.description || null,
          };

          if (user?.id) {
            insertPayload.user_id = user.id;
          }

          if (data.image_url) {
            insertPayload.image_url = data.image_url;
          }

          let { data: inserted, error } = await supabase
            .from('resources')
            .insert(insertPayload)
            .select()
            .single();

          // Graceful fallback: If image_url column doesn't exist in Supabase (PGRST204 or 42703), retry without it
          if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('image_url')) && insertPayload.image_url) {
            delete insertPayload.image_url;
            const retry = await supabase
              .from('resources')
              .insert(insertPayload)
              .select()
              .single();
            inserted = retry.data;
            error = retry.error;
          }

          if (!error && inserted) {
            const dbResource = inserted as Resource;
            setResources((prev) => {
              const updated = prev.map((r) => (r.id === tempId ? dbResource : r));
              persistLocally(updated);
              return updated;
            });
            setSyncStatus('synced');
            setSyncError(null);
            return dbResource;
          } else if (error) {
            console.warn('Supabase insert failed (saved locally):', error.message);
            setSyncStatus('local_only');
            setSyncError(error.message);
          }
        } catch (err: unknown) {
          console.error('Failed to insert resource in Supabase (saved locally):', err);
          setSyncStatus('local_only');
          setSyncError(err instanceof Error ? err.message : 'Database error');
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

    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        try {
          const updatePayload: Record<string, unknown> = {
            ...updates,
            updated_at: now,
          };
          delete updatePayload.id;

          const { error } = await supabase
            .from('resources')
            .update(updatePayload)
            .eq('id', id);

          if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('image_url')) && updatePayload.image_url) {
            delete updatePayload.image_url;
            await supabase.from('resources').update(updatePayload).eq('id', id);
          }
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
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistLocally(next);
      return next;
    });

    if (isConfigured) {
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

  const syncLocalToSupabase = async () => {
    if (!isConfigured) {
      return { success: false, count: 0, error: 'Supabase URL and Anon Key not configured in .env.local' };
    }
    const supabase = createClient();
    if (!supabase) {
      return { success: false, count: 0, error: 'Supabase client unavailable' };
    }

    try {
      setIsLoading(true);
      let insertedCount = 0;
      for (const res of resources) {
        const payload: Record<string, unknown> = {
          url: res.url,
          title: res.title,
          source_platform: res.source_platform,
          category: res.category,
          priority: res.priority,
          status: res.status,
          description: res.description || null,
        };
        if (user?.id) {
          payload.user_id = user.id;
        }
        if (res.image_url) {
          payload.image_url = res.image_url;
        }

        let { data, error } = await supabase.from('resources').insert(payload).select().single();
        if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('image_url')) && payload.image_url) {
          delete payload.image_url;
          const retry = await supabase.from('resources').insert(payload).select().single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          setSyncStatus('local_only');
          setSyncError(error.message);
          setIsLoading(false);
          return { success: false, count: insertedCount, error: error.message };
        } else if (data) {
          insertedCount++;
        }
      }

      await fetchResources();
      setSyncStatus('synced');
      setSyncError(null);
      setIsLoading(false);
      return { success: true, count: insertedCount };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, count: 0, error: err instanceof Error ? err.message : 'Sync failed' };
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
      if (filters.platform !== 'All' && res.source_platform !== filters.platform) {
        return false;
      }
      if (filters.category !== 'All' && res.category !== filters.category) {
        return false;
      }
      if (filters.priority !== 'All' && res.priority !== filters.priority) {
        return false;
      }
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
        isHydrated,
        syncStatus,
        syncError,
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
        syncLocalToSupabase,
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
