CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'active' NOT NULL
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so people can subscribe from landing page)
CREATE POLICY "Enable insert for anonymous users" ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins) can view the subscribers (or service role)
CREATE POLICY "Enable read access for authenticated users only" ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (true);
