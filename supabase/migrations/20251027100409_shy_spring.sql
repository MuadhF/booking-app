/*
  # Player Authentication System

  1. New Tables
    - `player_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications to existing tables
    - Add `player_id` (uuid, nullable, references player_profiles) to bookings table
    - This allows both authenticated player bookings and guest bookings

  3. Security
    - Enable RLS on player_profiles table
    - Add policies for players to manage their own data
    - Update booking policies to handle both authenticated and guest bookings

  4. Functions
    - Create function to automatically create player profile on signup
*/

-- Create player_profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add player_id to bookings table (nullable for guest bookings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'player_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN player_id uuid REFERENCES player_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on player_profiles
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for player_profiles
CREATE POLICY "Players can read their own profile"
  ON player_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Players can update their own profile"
  ON player_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Players can insert their own profile"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update booking policies to handle both authenticated and guest bookings
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can read bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

-- New booking policies
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read all bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

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

-- Function to automatically create player profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO player_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_player_id ON bookings(player_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_email ON player_profiles(email);