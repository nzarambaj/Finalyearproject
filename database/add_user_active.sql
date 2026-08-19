-- Deactivation flag: an inactive user cannot log in,
-- but their history (requests, comments) is preserved.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
