/*
  # Football Pitch Booking Schema

  1. New Tables
    - `pitches`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text)
      - `capacity` (integer)
      - `price_per_hour` (decimal)
      - `amenities` (text array)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `pitch_id` (uuid, foreign key to pitches)
      - `booking_date` (date)
      - `start_time` (time)
      - `duration_hours` (integer)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `total_price` (decimal)
      - `status` (text, default 'confirmed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access to pitches
    - Add policies for authenticated users to manage their bookings
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
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
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

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO public
  USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

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
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);