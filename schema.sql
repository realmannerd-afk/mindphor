-- ==========================================
-- COMPLETE SCHEMA RESET & SETUP 
-- MINDPHOR INTELLIGENCE (Phase 1)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. CLEANUP OLD / UNUSED TABLES
-- ==========================================
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS roadmap_recommendations CASCADE;
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF EXISTS trend_events CASCADE;
DROP TABLE IF EXISTS competitor_mentions CASCADE;
DROP TABLE IF EXISTS feedback_complaints CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS feedback_feature_requests CASCADE;
DROP TABLE IF EXISTS feature_requests CASCADE;
DROP TABLE IF EXISTS feedback_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS feedback_embeddings CASCADE;
DROP TABLE IF EXISTS feedback_items CASCADE;
DROP TABLE IF EXISTS feedback_sources CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS apps CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS action_tasks CASCADE;

-- ==========================================
-- 1. PROFILES TABLE (Direct link to Auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" 
  ON public.profiles FOR ALL USING (auth.uid() = id);

-- ==========================================
-- 2. APPS TABLE (Replaces Organizations/Projects)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  api_key TEXT DEFAULT md5(random()::text),
  alert_threshold INTEGER DEFAULT 70,
  retention_days INTEGER DEFAULT 30,
  memory_prune_limit INTEGER DEFAULT 5000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own apps" 
  ON public.apps FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 3. COMPETITORS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  description TEXT,
  status TEXT DEFAULT 'Monitoring',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own competitors" 
  ON public.competitors FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. ALERTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  severity TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts" 
  ON public.alerts FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 5. FEEDBACK TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  source TEXT,
  content TEXT NOT NULL,
  sentiment TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback" 
  ON public.feedback FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 6. GOALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  text TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" 
  ON public.goals FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 7. ACTION TASKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.action_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.action_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own action tasks" 
  ON public.action_tasks FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_apps_user_id ON public.apps(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_app_id ON public.competitors(app_id);
CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON public.competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_app_id ON public.alerts(app_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_app_id ON public.feedback(app_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_app_id ON public.goals(app_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_action_tasks_app_id ON public.action_tasks(app_id);
CREATE INDEX IF NOT EXISTS idx_action_tasks_user_id ON public.action_tasks(user_id);
