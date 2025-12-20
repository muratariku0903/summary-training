-- 既存の不正なFK制約をすべて削除
ALTER TABLE public.exercise_generator_output_configs 
DROP CONSTRAINT IF EXISTS fk_ex_out_cfg_quad_to_schemas;

-- 正しい複合FK制約を追加
-- exercise_generator_output_configs の (llm_id, data_type, exercise_type, difficulty) が
-- exercise_generator_output_configs_schemas の主キー (llm_id, data_type, exercise_type, difficulty) を参照
ALTER TABLE public.exercise_generator_output_configs 
ADD CONSTRAINT fk_ex_out_cfg_to_schemas 
FOREIGN KEY (llm_id, data_type, exercise_type, difficulty) 
REFERENCES public.exercise_generator_output_configs_schemas(llm_id, data_type, exercise_type, difficulty);

-- 個別のFK制約も追加（LLMテーブルへの直接参照）
ALTER TABLE public.exercise_generator_output_configs 
ADD CONSTRAINT fk_ex_out_cfg_llm 
FOREIGN KEY (llm_id) 
REFERENCES public.llms(id);
