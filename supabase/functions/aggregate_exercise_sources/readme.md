# aggregate-theme-sources

テーマ生成 Seed をテーマ単位で Source に集約し、未リンク Seed を差分リンクします。

## 事前条件

- 対象 Seed 条件:
  - `seed_generator_profiles.profile_type = 'ai_theme'`
  - `exercise_generator_seeds.status = 'active'`
  - `exercise_generator_seeds.theme_id IS NOT NULL`
