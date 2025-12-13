@@ .. @@
 -- Function to automatically create player profile on signup
 CREATE OR REPLACE FUNCTION handle_new_user()
 RETURNS trigger AS $$
 BEGIN
+  -- Ensure we have a valid full_name, with fallbacks
+  DECLARE
+    user_full_name text;
+  BEGIN
+    -- Try to get full_name from user metadata, with multiple fallbacks
+    user_full_name := COALESCE(
+      NEW.raw_user_meta_data->>'full_name',
+      NEW.raw_user_meta_data->>'name',
+      NEW.email,
+      'User'
+    );
+    
+    -- Ensure it's not empty string
+    IF user_full_name = '' OR user_full_name IS NULL THEN
+      user_full_name := 'User';
+    END IF;
+
   INSERT INTO player_profiles (id, email, full_name)
   VALUES (
     NEW.id,
     NEW.email,
-    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
+    user_full_name
   );
+  END;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;