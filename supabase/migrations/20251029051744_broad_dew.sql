/*
  # Fix Customer Columns in Bookings Table

  1. Issues Fixed
    - Ensure customer_name and customer_email columns exist and can store data
    - Check for any constraints that might prevent data insertion
    - Add proper indexes for performance

  2. Changes Made
    - Verify column existence and data types
    - Remove any problematic constraints
    - Ensure columns allow proper data storage
*/

-- Ensure customer_name column exists and has proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_name text;
  ELSE
    -- Ensure the column allows text and is not restricted
    ALTER TABLE bookings ALTER COLUMN customer_name TYPE text;
    ALTER TABLE bookings ALTER COLUMN customer_name DROP NOT NULL;
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
  ELSE
    -- Ensure the column allows text and is not restricted
    ALTER TABLE bookings ALTER COLUMN customer_email TYPE text;
    ALTER TABLE bookings ALTER COLUMN customer_email DROP NOT NULL;
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
  ELSE
    -- Ensure the column allows text and is not restricted
    ALTER TABLE bookings ALTER COLUMN customer_phone TYPE text;
    ALTER TABLE bookings ALTER COLUMN customer_phone DROP NOT NULL;
  END IF;
END $$;

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