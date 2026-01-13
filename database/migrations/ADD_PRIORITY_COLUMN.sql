-- Add priority column to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority text DEFAULT 'none';

-- Update existing rows if necessary (optional, since default handles new ones)
-- UPDATE todos SET priority = 'none' WHERE priority IS NULL;
