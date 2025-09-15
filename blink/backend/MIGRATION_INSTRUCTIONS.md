## Manual Database Migration Required

The following SQL needs to be run in your Supabase SQL editor to add the missing columns for Razorpay and COD payments:

```sql
-- Migration: Add Razorpay and COD payment fields to orders table
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS failure_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS billing_address jsonb DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);

-- Function to reduce product stock
CREATE OR REPLACE FUNCTION reduce_product_stock(product_id uuid, quantity_to_reduce integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products 
  SET stock_quantity = stock_quantity - quantity_to_reduce,
      updated_at = now()
  WHERE id = product_id
    AND stock_quantity >= quantity_to_reduce;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock or product not found';
  END IF;
END;
$$;
```

## How to Apply:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the above SQL
4. Click "Run" to execute

This will add the missing columns that the order controller needs for Razorpay and COD functionality.