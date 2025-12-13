/*
  # Fix Customer Columns in Bookings Table - Handle RLS Policies

  1. Issues Fixed
    - Drop RLS policies that depend on customer_email column
    - Ensure customer_name and customer_email columns exist and can store data
    - Recreate the RLS policies after column modifications

  2. Changes Made
    - Temporarily drop policies that reference customer_email
    - Verify column existence and data types
    - Recreate policies with proper structure
*/

-- First, drop the policies that depend on customer_email
DROP POLICY IF EXISTS "Players can read their own bookings" ON bookings;
DROP POLICY IF EXISTS "Players can update their own bookings" ON bookings;

-- Ensure customer_name column exists and has proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_name text;
  END IF;
END $$;

-- Ensure customer_email column exists and has proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_email text;
  END IF;
END $$;

-- Ensure customer_phone column exists and has proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_phone text;
  END IF;
END $$;

-- Remove NOT NULL constraints if they exist (they might be preventing data insertion)
ALTER TABLE bookings ALTER COLUMN customer_name DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN customer_phone DROP NOT NULL;

-- Recreate the RLS policies
CREATE POLICY "Players can read their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid() OR 
    customer_email = (SELECT email FROM player_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Players can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    player_id = auth.uid() OR 
    customer_email = (SELECT email FROM player_profiles WHERE id = auth.uid())
  );

-- Add indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name ON bookings(customer_name);

-- Verify the columns exist and log the result
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_email'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_phone'
  ) THEN
    RAISE LOG 'SUCCESS: All customer columns verified in bookings table';
  ELSE
    RAISE WARNING 'FAILED: Some customer columns are missing from bookings table';
  END IF;
END $$;