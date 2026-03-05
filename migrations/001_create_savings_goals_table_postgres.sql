-- Migration: Create savings_goals table (PostgreSQL)
-- Description: Creates the savings_goals table for tracking user savings goals with progress
-- Requirements: 5.1

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(10, 2) DEFAULT 0 CHECK (current_amount >= 0),
  progress NUMERIC(5, 2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_savings_goals_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE savings_goals IS 'Stores user savings goals with progress tracking';
COMMENT ON COLUMN savings_goals.id IS 'Unique identifier for the savings goal (UUID v4)';
COMMENT ON COLUMN savings_goals.user_id IS 'Foreign key reference to the user who owns this goal';
COMMENT ON COLUMN savings_goals.name IS 'Name/description of the savings goal';
COMMENT ON COLUMN savings_goals.target_amount IS 'Target amount to save (must be greater than 0)';
COMMENT ON COLUMN savings_goals.current_amount IS 'Current amount saved toward the goal';
COMMENT ON COLUMN savings_goals.progress IS 'Progress percentage (0-100) calculated as (current_amount / target_amount) * 100';
COMMENT ON COLUMN savings_goals.is_completed IS 'Flag indicating if the goal has been completed (current_amount = target_amount)';
COMMENT ON COLUMN savings_goals.created_at IS 'Timestamp when the goal was created';
COMMENT ON COLUMN savings_goals.updated_at IS 'Timestamp when the goal was last updated';
