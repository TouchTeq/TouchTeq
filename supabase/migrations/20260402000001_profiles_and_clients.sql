-- Business Profile (user/company settings)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'South Africa',
  postal_code TEXT,
  vat_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  last_contact_at TIMESTAMPTZ,
  last_contact_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_company ON clients(user_id, company_name);
CREATE INDEX idx_clients_status ON clients(user_id, status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can manage own profile"
  ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- Clients RLS
CREATE POLICY "Users can manage own clients"
  ON clients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp triggers
DROP TRIGGER IF EXISTS trigger_update_profile_timestamp ON profiles;
CREATE TRIGGER trigger_update_profile_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_client_timestamp ON clients;
CREATE TRIGGER trigger_update_client_timestamp
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();