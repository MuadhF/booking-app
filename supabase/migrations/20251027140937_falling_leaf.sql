/*
  # Fix player profile creation and booking linkage

  1. Ensure all auth users have corresponding player profiles
  2. Fix the trigger function to handle profile creation properly
  3. Update booking logic to properly link authenticated users
*/

-- First, ensure all existing auth users have player profiles
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
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(
    EXCLUDED.full_name,
    player_profiles.full_name
  ),
  updated_at = now();

-- Update any existing profiles that might have empty full_name
UPDATE player_profiles 
SET 
  full_name = COALESCE(
    NULLIF(full_name, ''),
    split_part(email, '@', 1),
    'User'
  ),
  updated_at = now()
WHERE full_name IS NULL OR full_name = '';

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_phone text;
BEGIN
  -- Extract full_name with multiple fallbacks
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Extract phone if provided
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Ensure full_name is not empty
  IF user_full_name = '' OR user_full_name IS NULL THEN
    user_full_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- If still empty, use 'User'
  IF user_full_name = '' OR user_full_name IS NULL THEN
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
      now(),
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
      RAISE LOG 'Error creating player profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- Update any existing bookings to link them to player profiles where possible
UPDATE bookings 
SET player_id = pp.id
FROM player_profiles pp
WHERE bookings.customer_email = pp.email 
  AND bookings.player_id IS NULL;