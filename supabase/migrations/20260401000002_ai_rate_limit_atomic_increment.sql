CREATE OR REPLACE FUNCTION increment_ai_rate_limit(
  p_user_id UUID,
  p_window_start TIMESTAMPTZ,
  p_max_per_minute INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Atomic increment: insert or update with increment
  INSERT INTO ai_rate_limits (user_id, window_start, request_count)
  VALUES (p_user_id, p_window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = ai_rate_limits.request_count + 1
  RETURNING ai_rate_limits.request_count INTO v_count;

  -- If this is the first insert (no conflict), v_count will be 1
  -- If there was a conflict, v_count is the incremented value

  RETURN QUERY SELECT
    v_count <= p_max_per_minute,
    v_count,
    GREATEST(0, p_max_per_minute - v_count);
END;
$$;
