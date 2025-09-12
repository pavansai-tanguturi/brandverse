-- Migration: Create addresses table and link to customers
-- This creates a proper normalized addresses table instead of JSONB fields

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('shipping', 'billing', 'both')),
  is_default boolean NOT NULL DEFAULT false,
  
  -- Address fields
  full_name text NOT NULL,
  phone text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  landmark text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON public.addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default);

-- Add constraint to ensure only one default address per customer per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_unique_default 
  ON public.addresses(customer_id, type) 
  WHERE is_default = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_addresses_updated_at();

-- Update orders table to reference addresses instead of storing JSONB
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL;

-- Create indexes for order address references
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address ON public.orders(shipping_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_billing_address ON public.orders(billing_address_id);

-- Add some sample address types as constraints for future use
COMMENT ON COLUMN public.addresses.type IS 'Address type: shipping, billing, or both';
COMMENT ON COLUMN public.addresses.is_default IS 'Whether this is the default address for the customer and type';
COMMENT ON TABLE public.addresses IS 'Customer addresses with proper normalization';
