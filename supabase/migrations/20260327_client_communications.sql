-- Client Communications Log
-- Automatically tracks emails and allows for manual interaction notes

CREATE TABLE IF NOT EXISTS public.client_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL, -- Enum-like: Invoice, Quote, Credit Note, Purchase Order, Statement, Reminder, Certificate, General
  subject text,
  sent_from text,
  status text DEFAULT 'Delivered', -- Delivered / Failed / Recorded
  content text,
  note_type text, -- Enum-like: Phone Call, Site Visit, Meeting, WhatsApp, Other
  metadata jsonb DEFAULT '{}'::jsonb,
  is_manual boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for faster retrieval per client
CREATE INDEX IF NOT EXISTS client_communications_client_id_idx ON public.client_communications (client_id);
CREATE INDEX IF NOT EXISTS client_communications_timestamp_idx ON public.client_communications (timestamp DESC);

-- Enable RLS
ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated full access" ON public.client_communications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cache last contact on clients table for high-performance list views
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contact_summary text;

-- Function and trigger to automatically update last_contact on client
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients
  SET 
    last_contact_at = NEW.timestamp,
    last_contact_summary = CASE 
      WHEN NEW.is_manual THEN NEW.note_type || ': ' || LEFT(NEW.content, 50)
      ELSE NEW.type || ': ' || NEW.subject
    END
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_last_contact_trigger
AFTER INSERT ON public.client_communications
FOR EACH ROW EXECUTE FUNCTION update_client_last_contact();
