import { relations } from 'drizzle-orm/relations'
import {
  userProfiles,
  seedGeneratorProfiles,
  exerciseGeneratorSeeds,
  llms,
  seedGeneratorThemes,
  idpLinks,
  exercises,
  exerciseGeneratorProfiles,
  seedGeneratorCategories,
  exerciseEvaluations,
  exerciseEvaluationDetails,
  exerciseSubmissions,
  exerciseGeneratorSources,
  exerciseGeneratorProfileSourcePatterns,
  exerciseGeneratorOutputConfigs,
  seedGeneratorThemeCategories,
  exerciseGeneratorSourceSeeds,
  exerciseGeneratorProfileSources,
  exerciseGeneratorOutputConfigsSchemas,
} from './schema'
import { users as usersInAuth } from './auth_schema'

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [userProfiles.id],
    references: [usersInAuth.id],
  }),
}))

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
  userProfiles: many(userProfiles),
  idpLinks: many(idpLinks),
  exercises: many(exercises),
  exerciseSubmissions: many(exerciseSubmissions),
}))

export const exerciseGeneratorSeedsRelations = relations(
  exerciseGeneratorSeeds,
  ({ one, many }) => ({
    seedGeneratorProfile: one(seedGeneratorProfiles, {
      fields: [exerciseGeneratorSeeds.generatorProfileId],
      references: [seedGeneratorProfiles.id],
    }),
    llm: one(llms, {
      fields: [exerciseGeneratorSeeds.llmId],
      references: [llms.id],
    }),
    seedGeneratorTheme: one(seedGeneratorThemes, {
      fields: [exerciseGeneratorSeeds.themeId],
      references: [seedGeneratorThemes.id],
    }),
    exerciseGeneratorSourceSeeds: many(exerciseGeneratorSourceSeeds),
  }),
)

export const seedGeneratorProfilesRelations = relations(
  seedGeneratorProfiles,
  ({ many }) => ({
    exerciseGeneratorSeeds: many(exerciseGeneratorSeeds),
  }),
)

export const llmsRelations = relations(llms, ({ many }) => ({
  exerciseGeneratorSeeds: many(exerciseGeneratorSeeds),
  exerciseGeneratorOutputConfigs: many(exerciseGeneratorOutputConfigs),
  exerciseGeneratorOutputConfigsSchemas: many(exerciseGeneratorOutputConfigsSchemas),
}))

export const seedGeneratorThemesRelations = relations(
  seedGeneratorThemes,
  ({ many }) => ({
    exerciseGeneratorSeeds: many(exerciseGeneratorSeeds),
    exerciseGeneratorSources: many(exerciseGeneratorSources),
    seedGeneratorThemeCategories: many(seedGeneratorThemeCategories),
  }),
)

export const idpLinksRelations = relations(idpLinks, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [idpLinks.authUserId],
    references: [usersInAuth.id],
  }),
}))

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [exercises.createdBy],
    references: [usersInAuth.id],
  }),
  exerciseGeneratorProfile: one(exerciseGeneratorProfiles, {
    fields: [exercises.generateProfileId],
    references: [exerciseGeneratorProfiles.id],
  }),
  exerciseSubmissions: many(exerciseSubmissions),
}))

export const exerciseGeneratorProfilesRelations = relations(
  exerciseGeneratorProfiles,
  ({ one, many }) => ({
    exercises: many(exercises),
    exerciseGeneratorProfileSourcePatterns: many(exerciseGeneratorProfileSourcePatterns),
    exerciseGeneratorOutputConfig: one(exerciseGeneratorOutputConfigs, {
      fields: [exerciseGeneratorProfiles.outputConfigId],
      references: [exerciseGeneratorOutputConfigs.id],
    }),
    exerciseGeneratorProfileSources: many(exerciseGeneratorProfileSources),
  }),
)

export const seedGeneratorCategoriesRelations = relations(
  seedGeneratorCategories,
  ({ one, many }) => ({
    seedGeneratorCategory: one(seedGeneratorCategories, {
      fields: [seedGeneratorCategories.parentId],
      references: [seedGeneratorCategories.id],
      relationName: 'seedGeneratorCategories_parentId_seedGeneratorCategories_id',
    }),
    seedGeneratorCategories: many(seedGeneratorCategories, {
      relationName: 'seedGeneratorCategories_parentId_seedGeneratorCategories_id',
    }),
    seedGeneratorThemeCategories: many(seedGeneratorThemeCategories),
  }),
)

export const exerciseEvaluationDetailsRelations = relations(
  exerciseEvaluationDetails,
  ({ one }) => ({
    exerciseEvaluation: one(exerciseEvaluations, {
      fields: [exerciseEvaluationDetails.evaluationId],
      references: [exerciseEvaluations.id],
    }),
  }),
)

export const exerciseEvaluationsRelations = relations(
  exerciseEvaluations,
  ({ one, many }) => ({
    exerciseEvaluationDetails: many(exerciseEvaluationDetails),
    exerciseSubmission: one(exerciseSubmissions, {
      fields: [exerciseEvaluations.submissionId],
      references: [exerciseSubmissions.id],
    }),
  }),
)

export const exerciseSubmissionsRelations = relations(
  exerciseSubmissions,
  ({ one, many }) => ({
    exercise: one(exercises, {
      fields: [exerciseSubmissions.exerciseId],
      references: [exercises.id],
    }),
    usersInAuth: one(usersInAuth, {
      fields: [exerciseSubmissions.userId],
      references: [usersInAuth.id],
    }),
    exerciseEvaluations: many(exerciseEvaluations),
  }),
)

export const exerciseGeneratorSourcesRelations = relations(
  exerciseGeneratorSources,
  ({ one, many }) => ({
    seedGeneratorTheme: one(seedGeneratorThemes, {
      fields: [exerciseGeneratorSources.themeId],
      references: [seedGeneratorThemes.id],
    }),
    exerciseGeneratorSourceSeeds: many(exerciseGeneratorSourceSeeds),
    exerciseGeneratorProfileSources: many(exerciseGeneratorProfileSources),
  }),
)

export const exerciseGeneratorProfileSourcePatternsRelations = relations(
  exerciseGeneratorProfileSourcePatterns,
  ({ one }) => ({
    exerciseGeneratorProfile: one(exerciseGeneratorProfiles, {
      fields: [exerciseGeneratorProfileSourcePatterns.profileId],
      references: [exerciseGeneratorProfiles.id],
    }),
  }),
)

export const exerciseGeneratorOutputConfigsRelations = relations(
  exerciseGeneratorOutputConfigs,
  ({ one, many }) => ({
    llm: one(llms, {
      fields: [exerciseGeneratorOutputConfigs.llmId],
      references: [llms.id],
    }),
    exerciseGeneratorProfiles: many(exerciseGeneratorProfiles),
  }),
)

export const seedGeneratorThemeCategoriesRelations = relations(
  seedGeneratorThemeCategories,
  ({ one }) => ({
    seedGeneratorCategory: one(seedGeneratorCategories, {
      fields: [seedGeneratorThemeCategories.categoryId],
      references: [seedGeneratorCategories.id],
    }),
    seedGeneratorTheme: one(seedGeneratorThemes, {
      fields: [seedGeneratorThemeCategories.themeId],
      references: [seedGeneratorThemes.id],
    }),
  }),
)

export const exerciseGeneratorSourceSeedsRelations = relations(
  exerciseGeneratorSourceSeeds,
  ({ one }) => ({
    exerciseGeneratorSeed: one(exerciseGeneratorSeeds, {
      fields: [exerciseGeneratorSourceSeeds.seedId],
      references: [exerciseGeneratorSeeds.id],
    }),
    exerciseGeneratorSource: one(exerciseGeneratorSources, {
      fields: [exerciseGeneratorSourceSeeds.sourceId],
      references: [exerciseGeneratorSources.id],
    }),
  }),
)

export const exerciseGeneratorProfileSourcesRelations = relations(
  exerciseGeneratorProfileSources,
  ({ one }) => ({
    exerciseGeneratorProfile: one(exerciseGeneratorProfiles, {
      fields: [exerciseGeneratorProfileSources.profileId],
      references: [exerciseGeneratorProfiles.id],
    }),
    exerciseGeneratorSource: one(exerciseGeneratorSources, {
      fields: [exerciseGeneratorProfileSources.sourceId],
      references: [exerciseGeneratorSources.id],
    }),
  }),
)

export const exerciseGeneratorOutputConfigsSchemasRelations = relations(
  exerciseGeneratorOutputConfigsSchemas,
  ({ one }) => ({
    llm: one(llms, {
      fields: [exerciseGeneratorOutputConfigsSchemas.llmId],
      references: [llms.id],
    }),
  }),
)
