import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core'

// seed_generator_themes テーブル
export const seedGeneratorThemes = pgTable('seed_generator_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonical_key: text('canonical_key').notNull().default(''),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  created_by: text('created_by'), // enum: seed_generator_theme_created_type
  description: text('description'),
  status: text('status').default('active').notNull(),
  is_active: boolean('is_active').default(false).notNull(),
  title: text('title'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// seed_generator_categories テーブル
export const seedGeneratorCategories = pgTable('seed_generator_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  description: text('description'),
  name: text('name').notNull(),
  parent_id: uuid('parent_id'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// seed_generator_theme_categories テーブル（中間テーブル）
export const seedGeneratorThemeCategories = pgTable(
  'seed_generator_theme_categories',
  {
    category_id: uuid('category_id')
      .notNull()
      .references(() => seedGeneratorCategories.id),
    theme_id: uuid('theme_id')
      .notNull()
      .references(() => seedGeneratorThemes.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.category_id, table.theme_id] }),
  }),
)

// その他のテーブルも必要に応じて追加
export const seedGeneratorProfiles = pgTable('seed_generator_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  config: jsonb('config').default({}).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(false).notNull(),
  meta: jsonb('meta').default({}).notNull(),
  name: text('name').notNull(),
  profile_type: text('profile_type').notNull(), // enum: seed_profile_type
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const exerciseGeneratorSeeds = pgTable('exercise_generator_seeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  fingerprint_sha256: text('fingerprint_sha256'),
  generator_profile_id: uuid('generator_profile_id')
    .notNull()
    .references(() => seedGeneratorProfiles.id),
  idempotency_key: text('idempotency_key'),
  locale: text('locale'),
  meta: jsonb('meta').default({}).notNull(),
  raw_text: text('raw_text'),
  status: text('status').default('active').notNull(), // enum: seed_status
  summary: text('summary'),
  title: text('title'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 型エクスポート
export type SeedGeneratorTheme = typeof seedGeneratorThemes.$inferSelect
export type SeedGeneratorThemeInsert = typeof seedGeneratorThemes.$inferInsert
export type SeedGeneratorCategory = typeof seedGeneratorCategories.$inferSelect
export type SeedGeneratorCategoryInsert = typeof seedGeneratorCategories.$inferInsert
export type SeedGeneratorThemeCategory = typeof seedGeneratorThemeCategories.$inferSelect
export type SeedGeneratorThemeCategoryInsert =
  typeof seedGeneratorThemeCategories.$inferInsert
