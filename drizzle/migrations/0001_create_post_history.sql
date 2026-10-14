CREATE TABLE public.post_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL DEFAULT '',
  thumb text,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.post_history TO service_role;
ALTER TABLE public.post_history ENABLE ROW LEVEL SECURITY;