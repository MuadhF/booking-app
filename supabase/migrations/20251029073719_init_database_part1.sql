/*
  # Football Pitch Booking Schema - Part 1

  1. New Tables
    - pitches: Venue information
    - bookings: Booking records with customer details
    - venue_credentials: Venue login credentials
    - player_profiles: Player profile linked to auth.users

  2. Security
    - RLS enabled on all tables
    - Appropriate policies for public and authenticated access
  
  3. Triggers
    - Auto-create player profiles on user signup
*/

-- Create pitches table
CREATE TABLE IF NOT EXISTS pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  capacity integer NOT NULL,
  price_per_hour decimal(10,2) NOT NULL,
  amenities text[] DEFAULT '{}',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid REFERENCES pitches(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  duration_hours integer NOT NULL DEFAULT 1,
  customer_name text,
  customer_email text,
  customer_phone text,
  total_price decimal(10,2) NOT NULL,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for pitches (public read access)
CREATE POLICY "Anyone can read pitches"
  ON pitches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert pitches"
  ON pitches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update pitches"
  ON pitches
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for bookings (public can create, read their own)
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

-- Insert sample pitches
INSERT INTO pitches (name, location, capacity, price_per_hour, amenities, image_url) VALUES
  ('Premier Football Arena', 'Mount Lavinia', 14, 3500.00, 
   ARRAY['Toilets', 'Audience seats', 'Shaded Pitch'], 
   'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800'),
  
  ('Elite Sports Complex', 'Kalubowila', 18, 3700.00, 
   ARRAY['Toilets', 'Changing Rooms', 'Parking', 'Shaded Pitch'], 
   'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=800'),
  
  ('Championship Futsal Ground', 'Colombo 07', 22, 4500.00, 
   ARRAY['Toilets', 'Changing Rooms', 'Water Station', 'Restaurant', 'Shaded Pitch'], 
   'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=800');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_pitch_id ON bookings(pitch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, start_time);

-- Create venue_credentials table
CREATE TABLE IF NOT EXISTS venue_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES pitches(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE venue_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for venue_credentials (public read for auth)
CREATE POLICY "Allow public read access for venue authentication"
  ON venue_credentials
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert venue credentials"
  ON venue_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update venue credentials"
  ON venue_credentials
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete venue credentials"
  ON venue_credentials
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venue_credentials_username ON venue_credentials(username);
CREATE INDEX IF NOT EXISTS idx_venue_credentials_venue_id ON venue_credentials(venue_id);

-- Insert sample venue credentials
INSERT INTO venue_credentials (venue_id, username, password_hash) 
SELECT 
  p.id,
  CASE 
    WHEN p.name = 'Premier Football Arena' THEN 'premier_arena'
    WHEN p.name = 'Elite Sports Complex' THEN 'elite_complex'
    WHEN p.name = 'Championship Futsal Ground' THEN 'futsal_forever'
    ELSE LOWER(REPLACE(p.name, ' ', '_'))
  END,
  CASE 
    WHEN p.name = 'Premier Football Arena' THEN 'arena123'
    WHEN p.name = 'Elite Sports Complex' THEN 'elite123'
    WHEN p.name = 'Championship Futsal Ground' THEN 'champ123'
    ELSE 'demo123'
  END
FROM pitches p
WHERE NOT EXISTS (
  SELECT 1 FROM venue_credentials vc WHERE vc.venue_id = p.id
);

-- Create player_profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add player_id and guest_id to bookings table
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

-- Function to automatically create player profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_phone text;
BEGIN
  -- Extract full_name with multiple fallbacks
  user_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Extract phone if provided
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  
  -- Ensure full_name is not empty
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Final fallback
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := 'User';
  END IF;

  -- Insert the profile with proper error handling
  BEGIN
    INSERT INTO player_profiles (id, email, full_name, phone, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_phone,
      NEW.created_at,
      now()
    );
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it
      UPDATE player_profiles 
      SET 
        full_name = user_full_name,
        phone = COALESCE(user_phone, phone),
        updated_at = now()
      WHERE id = NEW.id;
      
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE LOG 'Error creating player profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;
  
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.player_profiles TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;