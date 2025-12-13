/*
  # Fix Player Profile Creation Trigger

  1. Issues Fixed
    - Trigger not firing on auth.users table
    - Use proper schema references for auth schema
    - Add manual profile creation function as backup
    - Better error handling and logging

  2. Changes Made
    - Create a robust trigger function with proper schema handling
    - Add a manual function to create profiles for existing users
    - Ensure trigger is properly attached to auth.users table
    - Add comprehensive error handling
*/

-- First, ensure all existing auth users have player profiles
INSERT INTO public.player_profiles (id, email, full_name, phone, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    NULLIF(au.raw_user_meta_data->>'name', ''),
    split_part(au.email, '@', 1),
    'User'
  ) as full_name,
  NULLIF(au.raw_user_meta_data->>'phone', '') as phone,
  au.created_at,
  now()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.player_profiles pp WHERE pp.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(
    NULLIF(EXCLUDED.full_name, ''),
    public.player_profiles.full_name
  ),
  phone = COALESCE(EXCLUDED.phone, public.player_profiles.phone),
  updated_at = now();

-- Create a function to manually create player profiles (useful for debugging)
CREATE OR REPLACE FUNCTION public.create_player_profile_for_user(user_id uuid)
RETURNS void AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  user_full_name text;
  user_phone text;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with id % not found', user_id;
  END IF;
  
  -- Extract full_name with fallbacks
  user_full_name := COALESCE(
    NULLIF(user_record.raw_user_meta_data->>'full_name', ''),
    NULLIF(user_record.raw_user_meta_data->>'name', ''),
    split_part(user_record.email, '@', 1),
    'User'
  );
  
  -- Extract phone
  user_phone := NULLIF(user_record.raw_user_meta_data->>'phone', '');
  
  -- Insert or update profile
  INSERT INTO public.player_profiles (id, email, full_name, phone, created_at, updated_at)
  VALUES (
    user_record.id,
    user_record.email,
    user_full_name,
    user_phone,
    user_record.created_at,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, public.player_profiles.phone),
    updated_at = now();
    
  RAISE LOG 'Created/updated player profile for user: % (email: %)', user_id, user_record.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger function with explicit schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_phone text;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Trigger fired: Creating player profile for user: % (email: %)', NEW.id, NEW.email;
  
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
    INSERT INTO public.player_profiles (id, email, full_name, phone, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_phone,
      NEW.created_at,
      now()
    );
    
    RAISE LOG 'Successfully created player profile for user: % with name: %', NEW.id, user_full_name;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it
      RAISE LOG 'Profile already exists for user %, updating...', NEW.id;
      UPDATE public.player_profiles 
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.player_profiles TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_player_profile_for_user(uuid) TO postgres, anon, authenticated, service_role;

-- Verify the trigger exists and log the result
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created' 
    AND event_object_table = 'users'
    AND event_object_schema = 'auth'
  ) THEN
    RAISE LOG 'SUCCESS: Trigger on_auth_user_created verified on auth.users table';
  ELSE
    RAISE WARNING 'FAILED: Trigger on_auth_user_created was not created on auth.users table';
  END IF;
END $$;