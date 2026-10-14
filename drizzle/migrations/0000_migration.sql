CREATE TABLE public.tiktok_connection (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token text NOT NULL,
  refresh_token text NOT NULL DEFAULT '',
  expires_at bigint NOT NULL,
  name text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tiktok_connection TO service_role;
ALTER TABLE public.tiktok_connection ENABLE ROW LEVEL SECURITY;