-- MIGRATION: Hash existing student PINs
-- Run this in Supabase SQL Editor

-- 1. Add pin_hash column if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 2. Hash existing PINs using bcrypt
-- This updates the plain PIN values currently stored in 'pin' column
UPDATE students
SET pin_hash = crypt(pin, gen_salt('bf', 10))
WHERE pin_hash IS NULL OR pin_hash = pin;

-- 3. Verify migration
SELECT id, name, pin_hash IS NOT NULL as has_hash 
FROM students 
LIMIT 10;