// scripts/generate-types.ts
import { execFileSync } from 'child_process'
import { config } from 'dotenv'
import path from 'path'
import * as fs from 'fs'

// 環境変数を読み込み
config({ path: path.resolve(process.cwd(), '.env') })

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID

if (!projectId) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_PROJECT_ID is not set in .env.local')
  process.exit(1)
}

try {
  console.log(`Generating database types for project: ${projectId}`)

  const args = [
    'gen',
    'types',
    'typescript',
    '--project-id',
    projectId,
    '--schema',
    'public,storage,functions',
  ]
  const output = execFileSync('supabase', args, { encoding: 'utf-8' })

  // ファイルに出力
  const outputPath = path.resolve(process.cwd(), 'src/lib/supabase/schema/schema.ts')
  fs.writeFileSync(outputPath, output)
  console.log('Database schema file generated successfully!')
  console.log(`Output file: ${outputPath}`)

  // Supabase Functionsの方にも出力
  const outputPathForSupabaseFunctions = path.resolve(
    process.cwd(),
    'supabase/functions/_shared/types/database.ts',
  )
  fs.writeFileSync(outputPathForSupabaseFunctions, output)
  console.log('Database schema file generated successfully!')
  console.log(`Output file: ${outputPathForSupabaseFunctions}`)

  // Drizzle ORM スキーマ生成 (イントロスペクション)
  const drizzleArgs = ['introspect', '--config', 'drizzle.config.ts']
  execFileSync('drizzle-kit', drizzleArgs, { encoding: 'utf-8' })
  console.log('Drizzle schema file generated successfully!')
} catch (error) {
  console.error('Error generating types:', error)
  process.exit(1)
}
