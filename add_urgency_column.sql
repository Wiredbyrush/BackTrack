ALTER TABLE items ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high'));
