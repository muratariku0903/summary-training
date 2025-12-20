import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db_schema.ts";
import { Result } from "../types/common.ts";
import { ExerciseGeneratorSeedsInsertRow } from "../types/exercise_generator_seeds.ts";
import { DatabaseQueryError } from "../error/error.ts";

const SIM_TITLE = 0.92;
const SIM_TEXT = 0.87;
const HITS_LIMIT = 3;

export type DupHit = { id: string; title: string; sim: number; snippet: string };

export async function findSimilarByTitle(
  supabase: SupabaseClient<Database>,
  title: string
): Promise<Result<DupHit[]>> {
  const { data, error } = await supabase.rpc("find_similar_seeds_by_title", {
    q: title,
    min_sim: SIM_TITLE,
    lim: HITS_LIMIT,
  });
  if (error) return { success: false, error };

  return { success: true, data: data ?? [] };
}

export async function findSimilarByRawText(
  supabase: SupabaseClient<Database>,
  rawText: string
): Promise<Result<DupHit[]>> {
  const { data, error } = await supabase.rpc("find_similar_seeds_by_raw_text", {
    q: rawText,
    min_sim: SIM_TEXT,
    lim: HITS_LIMIT,
  });
  if (error) return { success: false, error };

  return { success: true, data: data ?? [] };
}

type GenerateExerciseSeedParams = {
  client: SupabaseClient<Database>;
  profileId: string;
  themeId: string | null;
  llmId: string | null;
  seedData: { title: string; summary: string; rawText: string };
};
type GenerateExerciseSeedResponse = { seed_id: string };

export const saveSeed = async (
  params: GenerateExerciseSeedParams
): Promise<Result<GenerateExerciseSeedResponse, DatabaseQueryError>> => {
  const { client, profileId, themeId, llmId, seedData } = params;

  const row: ExerciseGeneratorSeedsInsertRow = {
    status: "active",
    generator_profile_id: profileId,
    theme_id: themeId,
    llm_id: llmId,
    title: seedData.title,
    summary: seedData.summary,
    raw_text: seedData.rawText,
  };

  const { data, error } = await client
    .from("exercise_generator_seeds")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    return {
      success: false,
      error: new DatabaseQueryError(
        saveSeed.name,
        "INSERT",
        "exercise_generator_seeds",
        error.message
      ),
    };
  }

  return {
    success: true,
    data: { seed_id: data.id },
  };
};
