/*
  # Fix Venue Credentials RLS Policies

  1. Security Changes
    - Update RLS policy for venue_credentials table to allow public read access
    - This enables unauthenticated users to query credentials for login purposes
    - Maintain security by only allowing SELECT operations for authentication

  2. Changes Made
    - Drop existing restrictive SELECT policy
    - Create new public SELECT policy for authentication
    - Keep other operations restricted to authenticated users
*/

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Only authenticated users can read venue credentials" ON venue_credentials;

-- Create new policy that allows public read access for authentication
CREATE POLICY "Allow public read access for venue authentication"
  ON venue_credentials
  FOR SELECT
  TO public
  USING (true);

-- Keep other operations restricted to authenticated users
DROP POLICY IF EXISTS "Only authenticated users can manage venue credentials" ON venue_credentials;

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