-- Migration: Create savings_goals table
-- Description: Creates the savings_goals table for tracking user savings goals with progress
-- Requirements: 5.1

CREATE TABLE IF NOT EXISTS savings_goals (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(10, 2) DEFAULT 0 CHECK (current_amount >= 0),
  progress DECIMAL(5, 2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add comment to table
COMMENT ON TABLE savings_goals IS 'Stores user savings goals with progress tracking';

-- Add comments to columns
COMMENT ON COLUMN savings_goals.id IS 'Unique identifier for the savings goal (UUID v4)';
COMMENT ON COLUMN savings_goals.user_id IS 'Foreign key reference to the user who owns this goal';
COMMENT ON COLUMN savings_goals.name IS 'Name/description of the savings goal';
COMMENT ON COLUMN savings_goals.target_amount IS 'Target amount to save (must be greater than 0)';
COMMENT ON COLUMN savings_goals.current_amount IS 'Current amount saved toward the goal';
COMMENT ON COLUMN savings_goals.progress IS 'Progress percentage (0-100) calculated as (current_amount / target_amount) * 100';
COMMENT ON COLUMN savings_goals.is_completed IS 'Flag indicating if the goal has been completed (current_amount = target_amount)';
COMMENT ON COLUMN savings_goals.created_at IS 'Timestamp when the goal was created';
COMMENT ON COLUMN savings_goals.updated_at IS 'Timestamp when the goal was last updated';
