-- Migration: Self-contained generate_delivery_note_number
-- Date: 2026-06-16
--
-- The version in 20260616_repair_missing_rpcs.sql depends on a document_sequences
-- table that isn't usable on the live DB, so its CREATE failed. This version
-- derives the next number from the delivery_notes table + business_profile prefix
-- settings — no external dependency.

CREATE OR REPLACE FUNCTION public.generate_delivery_note_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  prefix_val       text;
  include_year_val boolean;
  year_str         text := extract(year from current_date)::text;
  next_num         integer;
  pattern          text;
BEGIN
  SELECT coalesce(delivery_note_prefix, 'DN'), coalesce(delivery_note_include_year, false)
  INTO prefix_val, include_year_val
  FROM public.business_profile LIMIT 1;

  prefix_val := coalesce(prefix_val, 'DN');
  include_year_val := coalesce(include_year_val, false);

  IF include_year_val THEN
    pattern := prefix_val || '-' || year_str || '-%';
  ELSE
    pattern := prefix_val || '-%';
  END IF;

  -- Trailing number after the last hyphen, max over matching documents
  SELECT coalesce(max((regexp_replace(delivery_note_number, '^.*-', ''))::int), 0) + 1
  INTO next_num
  FROM public.delivery_notes
  WHERE delivery_note_number LIKE pattern
    AND regexp_replace(delivery_note_number, '^.*-', '') ~ '^\d+$';

  IF include_year_val THEN
    RETURN prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  ELSE
    RETURN prefix_val || '-' || lpad(next_num::text, 4, '0');
  END IF;
END;
$$;
