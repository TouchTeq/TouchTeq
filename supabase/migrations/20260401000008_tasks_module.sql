-- Create generic update timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Main tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  due_time TIME,
  completed_at TIMESTAMPTZ,
  category TEXT,
  
  -- Relationships to other records (FK constraints added when referenced tables exist)
  client_id UUID,
  invoice_id UUID,
  quote_id UUID,
  purchase_order_id UUID,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date) WHERE status != 'done' AND status != 'cancelled';
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority) WHERE status != 'done' AND status != 'cancelled';
CREATE INDEX idx_tasks_client ON tasks(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_task_timestamp ON tasks;
CREATE TRIGGER trigger_update_task_timestamp
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
