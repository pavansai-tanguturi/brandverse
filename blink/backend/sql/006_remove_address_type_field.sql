-- Migration: Remove type field from addresses table
-- This removes the type field since we're simplifying address management

-- Drop the check constraint first
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_type_check;

-- Drop the type column
ALTER TABLE public.addresses DROP COLUMN IF EXISTS type;

-- Update the unique index to remove type dependency
DROP INDEX IF EXISTS idx_addresses_unique_default;

-- Create new unique index for default addresses without type
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_unique_default_customer 
  ON public.addresses(customer_id) 
  WHERE is_default = true;

-- Drop the type index since the column no longer exists
DROP INDEX IF EXISTS idx_addresses_type;

-- Update comment to reflect changes
COMMENT ON TABLE public.addresses IS 'Customer addresses without type classification - all addresses are general purpose';