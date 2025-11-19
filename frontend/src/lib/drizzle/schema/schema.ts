import { pgTable, index, uuid, text, boolean, jsonb, timestamp, uniqueIndex, foreignKey, pgPolicy, unique, bigserial, smallint, integer, check, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const createType = pgEnum("create_type", ['system', 'user', 'admin', 'import'])
export const difficultyLevel = pgEnum("difficulty_level", ['easy', 'medium', 'hard'])
export const exerciseEvaluationStatus = pgEnum("exercise_evaluation_status", ['queued', 'processing', 'succeeded', 'failed'])
export const exerciseOutputDataType = pgEnum("exercise_output_data_type", ['text', 'audio', 'text/audio'])
export const exerciseOutputDifficulty = pgEnum("exercise_output_difficulty", ['easy', 'medium', 'hard'])
export const exerciseOutputExerciseType = pgEnum("exercise_output_exercise_type", ['summary', 'rewrite'])
export const exerciseStatus = pgEnum("exercise_status", ['draft', 'ready', 'hidden'])
export const exerciseType = pgEnum("exercise_type", ['summary', 'explain', 'rewrite'])
export const jobRunMode = pgEnum("job_run_mode", ['scheduled', 'manual', 'retry', 'test'])
export const jobStatus = pgEnum("job_status", ['running', 'success', 'failed', 'warn'])
export const llmVendor = pgEnum("llm_vendor", ['openai', 'google', 'anthropic'])
export const seedGeneratorThemeCreatedType = pgEnum("seed_generator_theme_created_type", ['system', 'admin'])
export const seedProfileType = pgEnum("seed_profile_type", ['ai_theme', 'youtube_channels', 'web', 'storage'])
export const seedStatus = pgEnum("seed_status", ['active', 'paused', 'archived'])
export const sourceAggregateType = pgEnum("source_aggregate_type", ['theme', 'custom'])


export const seedGeneratorProfiles = pgTable("seed_generator_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	profileType: seedProfileType("profile_type").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	config: jsonb().default({}).notNull(),
	meta: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sgp_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_sgp_type").using("btree", table.profileType.asc().nullsLast().op("enum_ops")),
]);

export const seedGeneratorThemes = pgTable("seed_generator_themes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: seedGeneratorThemeCreatedType("created_by"),
	canonicalKey: text("canonical_key").default(').notNull(),
}, (table) => [
	index("idx_sgt_name_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
	uniqueIndex("uidx_sgt_canonical_key").using("btree", table.canonicalKey.asc().nullsLast().op("text_ops")),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userName: text("user_name"),
	displayName: text("display_name"),
	bio: text(),
	avatarUrl: text("avatar_url"),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "user_profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can insert own profile", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(auth.uid() = id)`  }),
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view own profile", { as: "permissive", for: "select", to: ["public"] }),
]);

export const exerciseGeneratorSeeds = pgTable("exercise_generator_seeds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	generatorProfileId: uuid("generator_profile_id").notNull(),
	status: seedStatus().default('active').notNull(),
	locale: text().default('ja-JP'),
	title: text(),
	summary: text(),
	rawText: text("raw_text"),
	meta: jsonb().default({}).notNull(),
	idempotencyKey: text("idempotency_key"),
	fingerprintSha256: text("fingerprint_sha256"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	themeId: uuid("theme_id"),
	llmId: uuid("llm_id"),
	rawTextTrgmGenerated: text("raw_text_trgm_generated").generatedAlwaysAs(sql`"left"(_trgm_normalize(raw_text), 3000)`),
}, (table) => [
	index("idx_egs_generator_profile").using("btree", table.generatorProfileId.asc().nullsLast().op("uuid_ops")),
	index("idx_egs_raw_text_trgm").using("gin", table.rawTextTrgmGenerated.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_egs_title_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.generatorProfileId],
			foreignColumns: [seedGeneratorProfiles.id],
			name: "exercise_generator_seeds_generator_profile_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.llmId],
			foreignColumns: [llms.id],
			name: "exercise_generator_seeds_llm_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.themeId],
			foreignColumns: [seedGeneratorThemes.id],
			name: "exercise_generator_seeds_theme_id_fkey"
		}).onDelete("cascade"),
]);

export const idpLinks = pgTable("idp_links", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	provider: text().notNull(),
	externalUserId: text("external_user_id").notNull(),
	authUserId: uuid("auth_user_id").notNull(),
	// TODO: failed to parse database type 'citext'
	emailAtLinkTime: unknown("email_at_link_time"),
	metadata: jsonb().default({}).notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_idp_links_auth_user_id").using("btree", table.authUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_idp_links_provider_external").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.externalUserId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "idp_links_auth_user_id_fkey"
		}).onDelete("cascade"),
	unique("idp_links_provider_external_user_id_key").on(table.provider, table.externalUserId),
	pgPolicy("deny_all", { as: "permissive", for: "all", to: ["public"], using: sql`false`, withCheck: sql`false`  }),
]);

export const jobRuns = pgTable("job_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	jobKey: text("job_key").notNull(),
	runMode: jobRunMode("run_mode").notNull(),
	status: jobStatus().notNull(),
	attempt: smallint().default(0).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	durationMs: integer("duration_ms").generatedAlwaysAs(sql`
CASE
    WHEN ((started_at IS NOT NULL) AND (finished_at IS NOT NULL)) THEN ((EXTRACT(epoch FROM (finished_at - started_at)) * (1000)::numeric))::integer
    ELSE NULL::integer
END`),
	metrics: jsonb().default({}).notNull(),
	errorCode: text("error_code"),
	errorSummary: text("error_summary"),
	errorDetail: text("error_detail"),
	requestId: text("request_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	status: exerciseStatus().default('ready').notNull(),
	createType: createType("create_type").notNull(),
	exerciseType: exerciseType("exercise_type").notNull(),
	title: text().notNull(),
	description: text(),
	storagePath: text("storage_path").notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	generateProfileId: uuid("generate_profile_id").notNull(),
	deleteFlg: boolean("delete_flg").default(false).notNull(),
	difficulty: difficultyLevel().notNull(),
}, (table) => [
	index("idx_exercises_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_exercises_status_created_at").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "exercises_created_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.generateProfileId],
			foreignColumns: [exerciseGeneratorProfiles.id],
			name: "exercises_generate_profile_id_fkey"
		}),
	unique("uq_exercises_storage_path").on(table.storagePath),
	pgPolicy("read_own_non_ready", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(created_by = auth.uid())` }),
	pgPolicy("read_ready_exercises_auth", { as: "permissive", for: "select", to: ["authenticated"] }),
	check("exercises_title_check", sql`(char_length(title) >= 1) AND (char_length(title) <= 120)`),
]);

export const llms = pgTable("llms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	vendor: llmVendor().notNull(),
	model: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	meta: jsonb().default({}).notNull(),
	maxTokens: integer("max_tokens"),
});

export const seedGeneratorCategories = pgTable("seed_generator_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	parentId: uuid("parent_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "seed_generator_categories_parent_id_fkey"
		}).onDelete("set null"),
]);

export const exerciseEvaluationDetails = pgTable("exercise_evaluation_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	evaluationId: uuid("evaluation_id").notNull(),
	perspective: text(),
	perspectiveName: text("perspective_name"),
	perspectiveSatisfyRate: numeric("perspective_satisfy_rate"),
	reason: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	rubric: jsonb(),
}, (table) => [
	index("exercise_evaluation_details_evaluation_id_idx").using("btree", table.evaluationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.evaluationId],
			foreignColumns: [exerciseEvaluations.id],
			name: "exercise_evaluation_details_evaluation_id_fkey"
		}).onDelete("cascade"),
]);

export const exerciseSubmissions = pgTable("exercise_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	exerciseId: uuid("exercise_id").notNull(),
	userId: uuid("user_id").notNull(),
	payload: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exercise_submissions_exercise_id_idx").using("btree", table.exerciseId.asc().nullsLast().op("uuid_ops")),
	index("exercise_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercises.id],
			name: "exercise_submissions_exercise_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "exercise_submissions_user_id_fkey"
		}),
]);

export const exerciseGeneratorSources = pgTable("exercise_generator_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	themeId: uuid("theme_id"),
	aggregateType: sourceAggregateType("aggregate_type").default('theme').notNull(),
}, (table) => [
	uniqueIndex("exercise_generator_sources_theme_key").using("btree", table.themeId.asc().nullsLast().op("uuid_ops")).where(sql`(theme_id IS NOT NULL)`),
	foreignKey({
			columns: [table.themeId],
			foreignColumns: [seedGeneratorThemes.id],
			name: "exercise_generator_sources_theme_id_fkey"
		}),
	unique("exercise_generator_sources_theme_aggregate_unique").on(table.themeId, table.aggregateType),
]);

export const exerciseGeneratorProfileSourcePatterns = pgTable("exercise_generator_profile_source_patterns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	sourceIds: uuid("source_ids").array().notNull(),
	sourceSetKey: text("source_set_key").generatedAlwaysAs(sql`uuid_array_sorted_key(source_ids)`),
	patternSize: smallint("pattern_size").notNull(),
	usageCount: integer("usage_count").default(1).notNull(),
	firstUsedAt: timestamp("first_used_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deleteFlg: boolean("delete_flg").default(false).notNull(),
}, (table) => [
	index("idx_profile_patterns_last_used").using("btree", table.profileId.asc().nullsLast().op("timestamptz_ops"), table.lastUsedAt.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [exerciseGeneratorProfiles.id],
			name: "exercise_generator_profile_source_patterns_profile_id_fkey"
		}).onDelete("cascade"),
	unique("uq_profile_set").on(table.profileId, table.sourceSetKey),
]);

export const exerciseGeneratorOutputConfigs = pgTable("exercise_generator_output_configs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	llmId: uuid("llm_id").notNull(),
	dataType: exerciseOutputDataType("data_type").notNull(),
	exerciseType: exerciseOutputExerciseType("exercise_type").notNull(),
	difficulty: exerciseOutputDifficulty().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.llmId],
			foreignColumns: [llms.id],
			name: "fk_ex_out_cfg_llm"
		}),
	unique("exercise_generator_output_configs_uni4").on(table.llmId, table.dataType, table.exerciseType, table.difficulty),
]);

export const exerciseGeneratorProfiles = pgTable("exercise_generator_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	outputConfigId: uuid("output_config_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sourceComboMin: smallint("source_combo_min").default(1).notNull(),
	sourceComboMax: smallint("source_combo_max").default(1).notNull(),
	allowRepeatWhenExhausted: boolean("allow_repeat_when_exhausted").default(false).notNull(),
}, (table) => [
	index("idx_ex_gen_profiles_output_config").using("btree", table.outputConfigId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.outputConfigId],
			foreignColumns: [exerciseGeneratorOutputConfigs.id],
			name: "fk_ex_gen_profiles_output_config"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const exerciseEvaluations = pgTable("exercise_evaluations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submissionId: uuid("submission_id").notNull(),
	status: exerciseEvaluationStatus().default('queued').notNull(),
	score: numeric(),
	feedback: jsonb(),
	evaluatedVendor: llmVendor("evaluated_vendor"),
	evaluatedModel: text("evaluated_model"),
	rubricsVersion: integer("rubrics_version"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exercise_evaluations_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("exercise_evaluations_submission_id_idx").using("btree", table.submissionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [exerciseSubmissions.id],
			name: "exercise_evaluations_submission_id_fkey"
		}).onDelete("cascade"),
]);

export const seedGeneratorThemeCategories = pgTable("seed_generator_theme_categories", {
	themeId: uuid("theme_id").notNull(),
	categoryId: uuid("category_id").notNull(),
}, (table) => [
	index("idx_sgtc_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [seedGeneratorCategories.id],
			name: "seed_generator_theme_categories_category_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.themeId],
			foreignColumns: [seedGeneratorThemes.id],
			name: "seed_generator_theme_categories_theme_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.themeId, table.categoryId], name: "seed_generator_theme_categories_pkey"}),
]);

export const exerciseGeneratorSourceSeeds = pgTable("exercise_generator_source_seeds", {
	sourceId: uuid("source_id").notNull(),
	seedId: uuid("seed_id").notNull(),
}, (table) => [
	index("idx_egss_source").using("btree", table.sourceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.seedId],
			foreignColumns: [exerciseGeneratorSeeds.id],
			name: "exercise_generator_source_seeds_seed_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [exerciseGeneratorSources.id],
			name: "exercise_generator_source_seeds_source_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.sourceId, table.seedId], name: "exercise_generator_source_seeds_pkey"}),
]);

export const exerciseGeneratorProfileSources = pgTable("exercise_generator_profile_sources", {
	profileId: uuid("profile_id").notNull(),
	sourceId: uuid("source_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [exerciseGeneratorProfiles.id],
			name: "exercise_generator_profile_sources_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [exerciseGeneratorSources.id],
			name: "exercise_generator_profile_sources_source_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.profileId, table.sourceId], name: "exercise_generator_profile_sources_pkey"}),
]);

export const exerciseGeneratorOutputConfigsSchemas = pgTable("exercise_generator_output_configs_schemas", {
	llmId: uuid("llm_id").notNull(),
	dataType: exerciseOutputDataType("data_type").notNull(),
	exerciseType: exerciseOutputExerciseType("exercise_type").notNull(),
	difficulty: exerciseOutputDifficulty().notNull(),
	schema: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ex_out_cfg_schema_llm").using("btree", table.llmId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.llmId],
			foreignColumns: [llms.id],
			name: "fk_ex_out_cfg_schema_llm"
		}).onUpdate("cascade").onDelete("restrict"),
	primaryKey({ columns: [table.llmId, table.dataType, table.exerciseType, table.difficulty], name: "exercise_generator_output_configs_schemas_pkey"}),
	check("exercise_generator_output_configs_schemas_schema_is_object", sql`jsonb_typeof(schema) = 'object'::text`),
]);

export const exerciseEvaluationRubrics = pgTable("exercise_evaluation_rubrics", {
	version: integer().notNull(),
	exerciseType: exerciseType("exercise_type").notNull(),
	difficulty: difficultyLevel().notNull(),
	perspective: text(),
	perspectiveName: text("perspective_name"),
	detail: text(),
	weight: numeric().default('1.0').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.version, table.exerciseType, table.difficulty], name: "exercise_evaluation_rubrics_pkey"}),
]);
