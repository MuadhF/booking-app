/*
  # Fix Player Profiles Schema

  1. Ensure player_profiles table has correct structure
  2. Make full_name column more flexible
  3. Add proper constraints and defaults
*/

-- Ensure the player_profiles table exists with correct structure
DO $$
BEGIN
  -- Check if table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_profiles') THEN
    CREATE TABLE player_profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      full_name text NOT NULL DEFAULT 'User',
      phone text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;

  -- Ensure full_name column exists and has proper constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE player_profiles ADD COLUMN full_name text NOT NULL DEFAULT 'User';
  ELSE
    -- Update existing column to have default
    ALTER TABLE player_profiles ALTER COLUMN full_name SET DEFAULT 'User';
    ALTER TABLE player_profiles ALTER COLUMN full_name SET NOT NULL;
  END IF;

  -- Ensure phone column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE player_profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Update any existing rows that might have null full_name
UPDATE player_profiles 
SET full_name = COALESCE(full_name, email, 'User') 
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

  -- Insert the profile
  INSERT INTO player_profiles (id, email, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_phone,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating player profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();