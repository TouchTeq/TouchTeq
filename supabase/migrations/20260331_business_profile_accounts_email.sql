ALTER TABLE public.business_profile
ADD COLUMN IF NOT EXISTS accounts_email text DEFAULT 'accounts@touchteq.co.za';
