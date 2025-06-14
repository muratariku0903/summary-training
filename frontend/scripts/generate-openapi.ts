// scripts/generate-openapi.ts (例)
import { z } from 'zod'
import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi'
import {
  requestSchema as SignupRequestSchema,
  responseSchema as SignupResponseSchema,
} from '../src/app/api/auth/signup/route.ts'
import * as fs from 'fs'
import * as path from 'path'
import { apiErrorObjectSchema, apiSuccessObjectSchema } from '../src/lib/api/response.ts'
import openapiTS from 'openapi-typescript'
import * as ts from 'typescript'

extendZodWithOpenApi(z)
const registry = new OpenAPIRegistry()

registry.registerPath({
  method: 'post',
  path: '/auth/signup',
  summary: '新規登録',
  request: { params: SignupRequestSchema },
  responses: {
    200: {
      description: 'ユーザーID',
      content: {
        'application/json': {
          schema: apiSuccessObjectSchema(SignupResponseSchema),
        },
      },
    },
    400: {
      description: '不正リクエスト',
      content: {
        'application/json': {
          schema: apiErrorObjectSchema,
        },
      },
    },
    500: {
      description: 'サーバーエラー',
      content: {
        'application/json': {
          schema: apiErrorObjectSchema,
        },
      },
    },
  },
})

const generator = new OpenApiGeneratorV3(registry.definitions)
const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Next.js API',
    version: '1.0.0',
    description: 'API documentation for Next.js Route Handlers',
  },
  servers: [{ url: 'http://localhost:3000/api' }],
})

const outputPath = path.resolve(process.cwd(), 'src/lib/api/generated/openapi.json')
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2), 'utf-8')
console.log(`OpenAPI document generated at ${outputPath}`)

const generateOpenAPI = async (): Promise<void> => {
  const tsTypes = await openapiTS(JSON.stringify(openApiDocument))

  const tsOut = path.resolve(process.cwd(), 'src/lib/api/generated/openapi-types.ts')
  fs.mkdirSync(path.dirname(tsOut), { recursive: true })

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  )

  const tsContent = tsTypes
    .map((node: ts.Node) => printer.printNode(ts.EmitHint.Unspecified, node, sourceFile))
    .join('\n\n')

  fs.writeFileSync(tsOut, tsContent, 'utf-8')
  console.log(`TypeScript definitions generated at ${tsOut}`)
}

generateOpenAPI()
