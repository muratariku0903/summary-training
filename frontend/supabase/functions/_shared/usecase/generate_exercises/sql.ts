export const SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN = `
  SELECT
    pattern_id,
    source_ids
  FROM public.pick_random_unused_source_pattern(
          $1,    -- p_profile_id
          $2,    -- p_kmin (最小ソース数)
          $3,    -- p_kmax (最大ソース数)
          $4,    -- p_max_attempts
          $5     -- p_allow_duplicates (重複許可フラグ)
        )
`
