-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."create_type" AS ENUM('system', 'user', 'admin', 'import');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."exercise_evaluation_status" AS ENUM('queued', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."exercise_output_data_type" AS ENUM('text', 'audio', 'text/audio');--> statement-breakpoint
CREATE TYPE "public"."exercise_output_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."exercise_output_exercise_type" AS ENUM('summary', 'rewrite');--> statement-breakpoint
CREATE TYPE "public"."exercise_status" AS ENUM('draft', 'ready', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."exercise_type" AS ENUM('summary', 'explain', 'rewrite');--> statement-breakpoint
CREATE TYPE "public"."job_run_mode" AS ENUM('scheduled', 'manual', 'retry', 'test');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('running', 'success', 'failed', 'warn');--> statement-breakpoint
CREATE TYPE "public"."llm_vendor" AS ENUM('openai', 'google', 'anthropic');--> statement-breakpoint
CREATE TYPE "public"."seed_generator_theme_created_type" AS ENUM('system', 'admin');--> statement-breakpoint
CREATE TYPE "public"."seed_profile_type" AS ENUM('ai_theme', 'youtube_channels', 'web', 'storage');--> statement-breakpoint
CREATE TYPE "public"."seed_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."source_aggregate_type" AS ENUM('theme', 'custom');--> statement-breakpoint
CREATE TABLE "seed_generator_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"profile_type" "seed_profile_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seed_generator_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seed_generator_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" "seed_generator_theme_created_type",
	"canonical_key" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seed_generator_themes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_name" text,
	"display_name" text,
	"bio" text,
	"avatar_url" text
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_seeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generator_profile_id" uuid NOT NULL,
	"status" "seed_status" DEFAULT 'active' NOT NULL,
	"locale" text DEFAULT 'ja-JP',
	"title" text,
	"summary" text,
	"raw_text" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" text,
	"fingerprint_sha256" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"theme_id" uuid,
	"llm_id" uuid,
	"raw_text_trgm_generated" text GENERATED ALWAYS AS ("left"(_trgm_normalize(raw_text), 3000)) STORED
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_seeds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "idp_links" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"external_user_id" text NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email_at_link_time" "citext",
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idp_links_provider_external_user_id_key" UNIQUE("provider","external_user_id")
);
--> statement-breakpoint
ALTER TABLE "idp_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_key" text NOT NULL,
	"run_mode" "job_run_mode" NOT NULL,
	"status" "job_status" NOT NULL,
	"attempt" smallint DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"duration_ms" integer GENERATED ALWAYS AS (
CASE
    WHEN ((started_at IS NOT NULL) AND (finished_at IS NOT NULL)) THEN ((EXTRACT(epoch FROM (finished_at - started_at)) * (1000)::numeric))::integer
    ELSE NULL::integer
END) STORED,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_summary" text,
	"error_detail" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "exercise_status" DEFAULT 'ready' NOT NULL,
	"create_type" "create_type" NOT NULL,
	"exercise_type" "exercise_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"storage_path" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generate_profile_id" uuid NOT NULL,
	"delete_flg" boolean DEFAULT false NOT NULL,
	"difficulty" "difficulty_level" NOT NULL,
	CONSTRAINT "uq_exercises_storage_path" UNIQUE("storage_path"),
	CONSTRAINT "exercises_title_check" CHECK ((char_length(title) >= 1) AND (char_length(title) <= 120))
);
--> statement-breakpoint
ALTER TABLE "exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "llms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor" "llm_vendor" NOT NULL,
	"model" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_tokens" integer
);
--> statement-breakpoint
ALTER TABLE "llms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seed_generator_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seed_generator_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_evaluation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"perspective" text,
	"perspective_name" text,
	"perspective_satisfy_rate" numeric,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rubric" jsonb
);
--> statement-breakpoint
ALTER TABLE "exercise_evaluation_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"theme_id" uuid,
	"aggregate_type" "source_aggregate_type" DEFAULT 'theme' NOT NULL,
	CONSTRAINT "exercise_generator_sources_theme_aggregate_unique" UNIQUE("theme_id","aggregate_type")
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_profile_source_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"source_ids" uuid[] NOT NULL,
	"source_set_key" text GENERATED ALWAYS AS (uuid_array_sorted_key(source_ids)) STORED,
	"pattern_size" smallint NOT NULL,
	"usage_count" integer DEFAULT 1 NOT NULL,
	"first_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_flg" boolean DEFAULT false NOT NULL,
	CONSTRAINT "uq_profile_set" UNIQUE("profile_id","source_set_key")
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_profile_source_patterns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_output_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"llm_id" uuid NOT NULL,
	"data_type" "exercise_output_data_type" NOT NULL,
	"exercise_type" "exercise_output_exercise_type" NOT NULL,
	"difficulty" "exercise_output_difficulty" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_generator_output_configs_uni4" UNIQUE("llm_id","data_type","exercise_type","difficulty")
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_output_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"output_config_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_combo_min" smallint DEFAULT 1 NOT NULL,
	"source_combo_max" smallint DEFAULT 1 NOT NULL,
	"allow_repeat_when_exhausted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"status" "exercise_evaluation_status" DEFAULT 'queued' NOT NULL,
	"score" numeric,
	"feedback" jsonb,
	"evaluated_vendor" "llm_vendor",
	"evaluated_model" text,
	"rubrics_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seed_generator_theme_categories" (
	"theme_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "seed_generator_theme_categories_pkey" PRIMARY KEY("theme_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "seed_generator_theme_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_source_seeds" (
	"source_id" uuid NOT NULL,
	"seed_id" uuid NOT NULL,
	CONSTRAINT "exercise_generator_source_seeds_pkey" PRIMARY KEY("source_id","seed_id")
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_source_seeds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_profile_sources" (
	"profile_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "exercise_generator_profile_sources_pkey" PRIMARY KEY("profile_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_profile_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_generator_output_configs_schemas" (
	"llm_id" uuid NOT NULL,
	"data_type" "exercise_output_data_type" NOT NULL,
	"exercise_type" "exercise_output_exercise_type" NOT NULL,
	"difficulty" "exercise_output_difficulty" NOT NULL,
	"schema" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_generator_output_configs_schemas_pkey" PRIMARY KEY("llm_id","data_type","exercise_type","difficulty"),
	CONSTRAINT "exercise_generator_output_configs_schemas_schema_is_object" CHECK (jsonb_typeof(schema) = 'object'::text)
);
--> statement-breakpoint
ALTER TABLE "exercise_generator_output_configs_schemas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exercise_evaluation_rubrics" (
	"version" integer NOT NULL,
	"exercise_type" "exercise_type" NOT NULL,
	"difficulty" "difficulty_level" NOT NULL,
	"perspective" text,
	"perspective_name" text,
	"detail" text,
	"weight" numeric DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_evaluation_rubrics_pkey" PRIMARY KEY("version","exercise_type","difficulty")
);
--> statement-breakpoint
ALTER TABLE "exercise_evaluation_rubrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_seeds" ADD CONSTRAINT "exercise_generator_seeds_generator_profile_id_fkey" FOREIGN KEY ("generator_profile_id") REFERENCES "public"."seed_generator_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_seeds" ADD CONSTRAINT "exercise_generator_seeds_llm_id_fkey" FOREIGN KEY ("llm_id") REFERENCES "public"."llms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_seeds" ADD CONSTRAINT "exercise_generator_seeds_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "public"."seed_generator_themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idp_links" ADD CONSTRAINT "idp_links_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_generate_profile_id_fkey" FOREIGN KEY ("generate_profile_id") REFERENCES "public"."exercise_generator_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_generator_categories" ADD CONSTRAINT "seed_generator_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."seed_generator_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_evaluation_details" ADD CONSTRAINT "exercise_evaluation_details_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "public"."exercise_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_submissions" ADD CONSTRAINT "exercise_submissions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_submissions" ADD CONSTRAINT "exercise_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_sources" ADD CONSTRAINT "exercise_generator_sources_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "public"."seed_generator_themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_profile_source_patterns" ADD CONSTRAINT "exercise_generator_profile_source_patterns_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."exercise_generator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_output_configs" ADD CONSTRAINT "fk_ex_out_cfg_llm" FOREIGN KEY ("llm_id") REFERENCES "public"."llms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_profiles" ADD CONSTRAINT "fk_ex_gen_profiles_output_config" FOREIGN KEY ("output_config_id") REFERENCES "public"."exercise_generator_output_configs"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "exercise_evaluations" ADD CONSTRAINT "exercise_evaluations_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."exercise_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_generator_theme_categories" ADD CONSTRAINT "seed_generator_theme_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."seed_generator_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_generator_theme_categories" ADD CONSTRAINT "seed_generator_theme_categories_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "public"."seed_generator_themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_source_seeds" ADD CONSTRAINT "exercise_generator_source_seeds_seed_id_fkey" FOREIGN KEY ("seed_id") REFERENCES "public"."exercise_generator_seeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_source_seeds" ADD CONSTRAINT "exercise_generator_source_seeds_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."exercise_generator_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_profile_sources" ADD CONSTRAINT "exercise_generator_profile_sources_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."exercise_generator_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_profile_sources" ADD CONSTRAINT "exercise_generator_profile_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."exercise_generator_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_generator_output_configs_schemas" ADD CONSTRAINT "fk_ex_out_cfg_schema_llm" FOREIGN KEY ("llm_id") REFERENCES "public"."llms"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_sgp_active" ON "seed_generator_profiles" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_sgp_type" ON "seed_generator_profiles" USING btree ("profile_type" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_sgt_name_trgm" ON "seed_generator_themes" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_sgt_canonical_key" ON "seed_generator_themes" USING btree ("canonical_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_egs_generator_profile" ON "exercise_generator_seeds" USING btree ("generator_profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_egs_raw_text_trgm" ON "exercise_generator_seeds" USING gin ("raw_text_trgm_generated" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_egs_title_trgm" ON "exercise_generator_seeds" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_idp_links_auth_user_id" ON "idp_links" USING btree ("auth_user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_idp_links_provider_external" ON "idp_links" USING btree ("provider" text_ops,"external_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_exercises_created_by" ON "exercises" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_exercises_status_created_at" ON "exercises" USING btree ("status" enum_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "exercise_evaluation_details_evaluation_id_idx" ON "exercise_evaluation_details" USING btree ("evaluation_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "exercise_submissions_exercise_id_idx" ON "exercise_submissions" USING btree ("exercise_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "exercise_submissions_user_id_idx" ON "exercise_submissions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_generator_sources_theme_key" ON "exercise_generator_sources" USING btree ("theme_id" uuid_ops) WHERE (theme_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_profile_patterns_last_used" ON "exercise_generator_profile_source_patterns" USING btree ("profile_id" timestamptz_ops,"last_used_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ex_gen_profiles_output_config" ON "exercise_generator_profiles" USING btree ("output_config_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "exercise_evaluations_status_idx" ON "exercise_evaluations" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "exercise_evaluations_submission_id_idx" ON "exercise_evaluations" USING btree ("submission_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_sgtc_category" ON "seed_generator_theme_categories" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_egss_source" ON "exercise_generator_source_seeds" USING btree ("source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ex_out_cfg_schema_llm" ON "exercise_generator_output_configs_schemas" USING btree ("llm_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Users can insert own profile" ON "user_profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can update own profile" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view own profile" ON "user_profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "deny_all" ON "idp_links" AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "read_own_non_ready" ON "exercises" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((created_by = auth.uid()));--> statement-breakpoint
CREATE POLICY "read_ready_exercises_auth" ON "exercises" AS PERMISSIVE FOR SELECT TO "authenticated";
*/