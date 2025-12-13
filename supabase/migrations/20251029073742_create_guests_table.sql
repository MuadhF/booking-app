/*
  # Create Guests Table and Normalize Bookings

  1. New Tables
    - guests: Guest user information

  2. Modifications to bookings table
    - Add guest_id column
    - Migrate any existing customer data to guests table

  3. Security
    - Enable RLS on guests table
    - Add appropriate policies

  4. Indexes
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_customer_check'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_customer_check 
    CHECK (
      (player_id IS NOT NULL AND guest_id IS NULL) OR 
      (player_id IS NULL AND guest_id IS NOT NULL)
    );
  END IF;
END $$;

-- Remove old customer columns after migration
DO $$
BEGIN
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