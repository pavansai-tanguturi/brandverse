-- Create the delivery_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country text NOT NULL,
  region text NULL,
  city text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT delivery_locations_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create unique index to prevent duplicate locations
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_locations_unique 
ON public.delivery_locations USING btree (
  lower(country),
  lower(COALESCE(region, ''::text)),
  lower(COALESCE(city, ''::text))
) TABLESPACE pg_default;

-- Create index for active locations and country for faster queries
CREATE INDEX IF NOT EXISTS idx_delivery_locations_active 
ON public.delivery_locations USING btree (is_active, country) 
TABLESPACE pg_default;

-- Create additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_locations_country 
ON public.delivery_locations USING btree (country) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_delivery_locations_region 
ON public.delivery_locations USING btree (region) 
WHERE is_active = true AND region IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_locations_city 
ON public.delivery_locations USING btree (city) 
WHERE is_active = true AND city IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_delivery_locations_updated_at ON delivery_locations;
CREATE TRIGGER trigger_update_delivery_locations_updated_at 
  BEFORE UPDATE ON delivery_locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_delivery_locations_updated_at();

-- Insert delivery locations - Country-wide delivery for India
INSERT INTO public.delivery_locations (country, region, city, is_active) VALUES
  ('India', null, null, true), -- 🇮🇳 COUNTRY-WIDE: Enable delivery to ALL locations in India
  ('India', 'Andhra Pradesh', 'Vijayawada', true),
  ('India', 'Andhra Pradesh', 'Guntur', true),
  ('India', 'Andhra Pradesh', 'Bhimavaram', true), -- Now enabled since country-wide is active
  ('India', 'Telangana', 'Hyderabad', true),
  ('India', 'Telangana', 'Warangal', true),
  ('India', 'Karnataka', 'Bangalore', true),
  ('India', 'Karnataka', 'Mysore', true),
  ('India', 'Tamil Nadu', 'Chennai', true),
  ('India', 'Tamil Nadu', 'Coimbatore', true),
  ('India', 'Maharashtra', 'Mumbai', true),
  ('India', 'Maharashtra', 'Pune', true)
ON CONFLICT (lower(country), lower(COALESCE(region, ''::text)), lower(COALESCE(city, ''::text))) 
DO UPDATE SET 
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (optional - uncomment if you want to restrict access)
-- CREATE POLICY "Allow public read access to active delivery locations" 
-- ON public.delivery_locations FOR SELECT 
-- USING (is_active = true);

-- CREATE POLICY "Allow admin full access to delivery locations" 
-- ON public.delivery_locations FOR ALL 
-- USING (auth.jwt() ->> 'role' = 'admin');