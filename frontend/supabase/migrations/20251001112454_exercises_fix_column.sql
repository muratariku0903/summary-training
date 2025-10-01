CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Step 2: 新しいカラムを追加
ALTER TABLE exercises ADD COLUMN difficulty_new difficulty_level;

-- Step 3: 既存データを変換（数値 → enum）
UPDATE exercises SET difficulty_new = 
  CASE 
    WHEN difficulty <= 2 THEN 'easy'::difficulty_level
    WHEN difficulty <= 4 THEN 'medium'::difficulty_level
    ELSE 'hard'::difficulty_level
  END
WHERE difficulty IS NOT NULL;

-- Step 4: 古いカラムを削除し、新しいカラムをリネーム
ALTER TABLE exercises DROP COLUMN difficulty;
ALTER TABLE exercises RENAME COLUMN difficulty_new TO difficulty;

-- Step 5: NOT NULL制約を追加（必要に応じて）
ALTER TABLE exercises ALTER COLUMN difficulty SET NOT NULL;
