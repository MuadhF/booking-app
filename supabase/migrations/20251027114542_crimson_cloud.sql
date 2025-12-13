/*
  # Fix booking constraints and player profile issues

  1. Ensure player_profiles table exists and is properly populated
  2. Fix any orphaned user records
  3. Make booking creation more robust
*/

-- First, ensure all auth users have corresponding player profiles
INSERT INTO player_profiles (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as full_name,
  au.created_at,
  now()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM player_profiles pp WHERE pp.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Update any existing profiles that might have empty full_name
UPDATE player_profiles 
SET full_name = COALESCE(
  NULLIF(full_name, ''),
  split_part(email, '@', 1),
  'User'
)
WHERE full_name IS NULL OR full_name = '';

-- Ensure the foreign key constraint allows NULL values (for guest bookings)
DO $$
BEGIN
  -- Check if the constraint exists and drop it if it's too restrictive
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_player_id_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_player_id_fkey;
  END IF;
  
  -- Recreate the constraint to allow NULL values
  ALTER TABLE bookings 
  ADD CONSTRAINT bookings_player_id_fkey 
  FOREIGN KEY (player_id) 
  REFERENCES player_profiles(id) 
  ON DELETE SET NULL;
END $$;