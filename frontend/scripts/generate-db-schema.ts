// scripts/generate-types.ts
import { execSync } from 'child_process'
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

  const command = `supabase gen types typescript --project-id "${projectId}" --schema public,private,auth`
  const output = execSync(command, { encoding: 'utf-8' })

  // ファイルに出力
  const outputPath = path.resolve(process.cwd(), 'src/lib/supabase/schema/schema.ts')
  fs.writeFileSync(outputPath, output)

  console.log('Database types generated successfully!')
  console.log(`Output file: ${outputPath}`)
} catch (error) {
  console.error('Error generating types:', error)
  process.exit(1)
}
