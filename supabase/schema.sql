-- ==============================================================================
-- LinkTriage: Database Schema & Row Level Security (RLS) Policies
-- Multi-device synchronization schema for Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Create Enums / Custom Types if not already present
DO $$ BEGIN
    CREATE TYPE platform_type AS ENUM ('LinkedIn', 'X', 'Instagram', 'YouTube', 'Web');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_type AS ENUM ('High', 'Medium', 'Low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_type AS ENUM ('Inbox', 'In Progress', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('LinkedIn', 'X', 'Instagram', 'YouTube', 'Web')),
    category VARCHAR(100) NOT NULL DEFAULT 'Tech Skills',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('Inbox', 'In Progress', 'Completed')),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Indexes for performant filtering and sorting
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_priority ON public.resources(priority);
CREATE INDEX IF NOT EXISTS idx_resources_platform ON public.resources(source_platform);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies: Users can only query and mutate their own resources
DROP POLICY IF EXISTS "Users can view their own resources" ON public.resources;
CREATE POLICY "Users can view their own resources"
    ON public.resources
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;
CREATE POLICY "Users can insert their own resources"
    ON public.resources
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
CREATE POLICY "Users can update their own resources"
    ON public.resources
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resources" ON public.resources;
CREATE POLICY "Users can delete their own resources"
    ON public.resources
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Trigger for automatically updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resources_updated_at ON public.resources;
CREATE TRIGGER trigger_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Realtime setup: Enable Realtime replication on public.resources
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
