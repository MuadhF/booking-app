/*
  # Add payment method to bookings table

  1. Changes
    - Add `payment_method` column to bookings table (cash or online)
    - Add `payment_status` column to track online payment completion
    - Add `stripe_session_id` column to store Stripe checkout session ID

  2. Notes
    - payment_method defaults to 'cash' for backward compatibility
    - payment_status defaults to 'completed' for cash payments
    - For online payments, payment_status will be 'pending' until Stripe webhook confirms
*/

-- Add payment_method column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'online'));
  END IF;
END $$;

-- Add payment_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed'));
  END IF;
END $$;

-- Add stripe_session_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_session_id text;
  END IF;
END $$;
