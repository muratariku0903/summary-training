import { getPoolClient } from '../_shared/db/client.ts'
import { run } from '../_shared/db/process.ts'

export const deps = {
  run,
  getPoolClient,
}
