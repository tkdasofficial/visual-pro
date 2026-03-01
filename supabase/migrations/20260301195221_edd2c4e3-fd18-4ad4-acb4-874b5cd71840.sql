
CREATE TABLE public.generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL DEFAULT 'create',
  prompt text NOT NULL,
  model text DEFAULT 'visual-pro-engine',
  status text NOT NULL DEFAULT 'pending',
  credits_used integer NOT NULL DEFAULT 1,
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.generation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.generation_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.generation_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all logs" ON public.generation_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_generation_logs_user_id ON public.generation_logs(user_id);
CREATE INDEX idx_generation_logs_created_at ON public.generation_logs(created_at DESC);
