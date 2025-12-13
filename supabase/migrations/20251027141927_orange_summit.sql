/*
  # Fix New User Profile Creation

  1. Issues Fixed
    - Trigger function not creating profiles for new signups
    - Better error handling and logging
    - Ensure trigger fires correctly on auth.users insert

  2. Changes Made
    - Recreate trigger function with improved logic
    - Add better error handling and fallbacks
    - Ensure trigger is properly attached
    - Add manual profile creation for any missing users
*/

-- First, ensure all existing auth users have player profiles
INSERT INTO player_profiles (id, email, full_name, phone, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    NULLIF(au.raw_user_meta_data->>'name', ''),
    split_part(au.email, '@', 1),
    'User'
  ) as full_name,
  au.raw_user_meta_data->>'phone' as phone,
  au.created_at,
  now()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM player_profiles pp WHERE pp.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_phone text;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Creating player profile for user: % (email: %)', NEW.id, NEW.email;
  
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
      now(),
      now()
    );
    
    RAISE LOG 'Successfully created player profile for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it
      RAISE LOG 'Profile already exists for user %, updating...', NEW.id;
      UPDATE player_profiles 
      SET 
        full_name = user_full_name,
        phone = COALESCE(user_phone, phone),
        updated_at = now()
      WHERE id = NEW.id;
      
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE LOG 'Error creating player profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- Still return NEW to allow user creation to succeed
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Verify the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created' 
    AND event_object_table = 'users'
    AND event_object_schema = 'auth'
  ) THEN
    RAISE EXCEPTION 'Trigger on_auth_user_created was not created successfully';
  ELSE
    RAISE LOG 'Trigger on_auth_user_created verified successfully';
  END IF;
END $$;