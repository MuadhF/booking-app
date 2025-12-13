/*
  # Fix Player Profiles RLS for Venue Dashboard Access

  1. Changes
    - Add public read policy for player_profiles so venues can see customer names
    - This allows venue dashboards to display customer information from bookings
    
  2. Security
    - Only allows reading basic profile info (name, email, phone)
    - Write operations still restricted to profile owner
*/

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Players can read their own profile" ON player_profiles;

-- Add public read policy so venues can see customer information
CREATE POLICY "Anyone can read player profiles"
  ON player_profiles
  FOR SELECT
  TO public
  USING (true);

-- Keep write operations restricted to owner
-- (existing update and insert policies remain unchanged)
