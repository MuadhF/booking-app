/*
  # Create Guests Table and Normalize Bookings Schema

  1. New Tables
    - `guests`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, not null)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications to bookings table
    - Add `guest_id` (uuid, nullable, references guests)
    - Remove redundant customer columns (customer_name, customer_email, customer_phone)
    - Keep both `player_id` and `guest_id` for flexibility

  3. Data Migration
    - Migrate existing booking customer data to guests table
    - Update bookings to reference the new guest records

  4. Security
    - Enable RLS on guests table
    - Update booking policies to work with the new structure
    - Add appropriate policies for guest data access

  5. Indexes
    - Add performance indexes for guest lookups
*/

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on guests table
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Policies for guests table
CREATE POLICY "Public can read guests for booking purposes"
  ON guests
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create guest records"
  ON guests
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update guest records"
  ON guests
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add guest_id column to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'guest_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN guest_id uuid REFERENCES guests(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migrate existing customer data to guests table and update bookings
DO $$
DECLARE
  booking_record RECORD;
  guest_id_var uuid;
BEGIN
  -- Loop through all bookings that have customer data but no guest_id
  FOR booking_record IN 
    SELECT id, customer_name, customer_email, customer_phone
    FROM bookings 
    WHERE guest_id IS NULL 
      AND (customer_name IS NOT NULL AND customer_name != '')
      AND (customer_email IS NOT NULL AND customer_email != '')
  LOOP
    -- Check if a guest with this email already exists
    SELECT id INTO guest_id_var
    FROM guests 
    WHERE email = booking_record.customer_email
    LIMIT 1;
    
    -- If no guest exists, create one
    IF guest_id_var IS NULL THEN
      INSERT INTO guests (name, email, phone)
      VALUES (
        booking_record.customer_name,
        booking_record.customer_email,
        booking_record.customer_phone
      )
      RETURNING id INTO guest_id_var;
    END IF;
    
    -- Update the booking to reference the guest
    UPDATE bookings 
    SET guest_id = guest_id_var
    WHERE id = booking_record.id;
  END LOOP;
  
  RAISE LOG 'Successfully migrated customer data to guests table';
END $$;

-- Add constraint to ensure either player_id or guest_id is set (but not both)
ALTER TABLE bookings 
ADD CONSTRAINT bookings_customer_check 
CHECK (
  (player_id IS NOT NULL AND guest_id IS NULL) OR 
  (player_id IS NULL AND guest_id IS NOT NULL)
);

-- Remove old customer columns after migration
DO $$
BEGIN
  -- Drop policies that depend on customer_email first
  DROP POLICY IF EXISTS "Players can read their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Players can update their own bookings" ON bookings;
  
  -- Remove the old customer columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE bookings DROP COLUMN customer_name;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE bookings DROP COLUMN customer_email;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE bookings DROP COLUMN customer_phone;
  END IF;
END $$;

-- Recreate booking policies with new structure
CREATE POLICY "Players can read their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Players can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (player_id = auth.uid());

-- Add policy for guests to read bookings (by email lookup)
CREATE POLICY "Guests can read their own bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(name);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);

-- Add foreign key constraint for guest_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_guest_id_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_guest_id_fkey 
    FOREIGN KEY (guest_id) 
    REFERENCES guests(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Verify the migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'guests'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'guest_id'
  ) THEN
    RAISE LOG 'SUCCESS: Guests table created and bookings normalized successfully';
  ELSE
    RAISE WARNING 'FAILED: Migration did not complete successfully';
  END IF;
END $$;