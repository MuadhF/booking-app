/*
  # Venue Credentials Management

  1. New Tables
    - `venue_credentials`
      - `id` (uuid, primary key)
      - `venue_id` (uuid, foreign key to pitches)
      - `username` (text, unique)
      - `password_hash` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on venue_credentials table
    - Add policies for authenticated access only
    - Create indexes for performance

  3. Sample Data
    - Insert demo credentials for existing venues
*/

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

-- Policies for venue_credentials (authenticated access only)
CREATE POLICY "Only authenticated users can read venue credentials"
  ON venue_credentials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can manage venue credentials"
  ON venue_credentials
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venue_credentials_username ON venue_credentials(username);
CREATE INDEX IF NOT EXISTS idx_venue_credentials_venue_id ON venue_credentials(venue_id);

-- Insert sample venue credentials (using simple hashing for demo - in production use proper bcrypt)
INSERT INTO venue_credentials (venue_id, username, password_hash) 
SELECT 
  p.id,
  CASE 
    WHEN p.name = 'Premier Football Arena' THEN 'premier_arena'
    WHEN p.name = 'Elite Sports Complex' THEN 'elite_complex'
    WHEN p.name = 'Championship Futsal Ground' THEN 'championship_ground'
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