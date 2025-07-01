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
import { responseSchema as DeleteUserResponseSchema } from '../src/app/api/user/delete/route.ts'
import * as fs from 'fs'
import * as path from 'path'
import { apiErrorObjectSchema, apiSuccessObjectSchema } from '../src/lib/api/response.ts'
import openapiTS from 'openapi-typescript'
import * as ts from 'typescript'

extendZodWithOpenApi(z)
const registry = new OpenAPIRegistry()

/**
 * OpenAPIドキュメントの型定義
 */
type OpenAPIDocument = {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  servers: Array<{
    url: string
  }>
  components: {
    securitySchemes: {
      [key: string]: {
        type: string
        scheme: string
        bearerFormat?: string
        description?: string
      }
    }
    schemas: Record<string, unknown>
    parameters: Record<string, unknown>
  }
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string
        description?: string
        security?: Array<{
          [securityScheme: string]: string[]
        }>
        parameters?: unknown[]
        requestBody?: unknown
        responses: {
          [statusCode: string]: unknown
        }
      }
    }
  }
}

// セキュリティコンポーネントを登録
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase JWT Token (Authorization: Bearer <token>)',
})

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
registry.registerPath({
  method: 'delete',
  path: '/user/delete',
  summary: 'ユーザー削除',
  description: '認証されたユーザーのアカウントを削除します。このAPIは認証が必要です。',
  security: [{ BearerAuth: [] }], // JWT Token
  responses: {
    200: {
      description: '削除済みユーザーID',
      content: {
        'application/json': {
          schema: apiSuccessObjectSchema(DeleteUserResponseSchema),
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
    401: {
      description: '認証が必要です',
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

/**
 * OpenAPI定義から認証が必要なエンドポイントを抽出
 */
const extractAuthRequiredEndpoints = (
  openApiDoc: OpenAPIDocument
): Record<string, string[]> => {
  const authEndpoints: Record<string, string[]> = {}

  if (!openApiDoc.paths) return authEndpoints

  for (const [path, pathItem] of Object.entries(openApiDoc.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation === 'object' && operation.security) {
        // security配列が存在し、BearerAuthが含まれている場合
        const hasBearerAuth = operation.security.some(
          (securityItem) => securityItem.BearerAuth !== undefined
        )

        if (hasBearerAuth) {
          if (!authEndpoints[path]) {
            authEndpoints[path] = []
          }
          authEndpoints[path].push(method.toUpperCase())
        }
      }
    }
  }

  return authEndpoints
}

/**
 * 認証マップの型定義を生成
 */
const generateAuthTypeDefinitions = (authEndpoints: Record<string, string[]>): string => {
  // 認証が必要なエンドポイントのリテラル型を生成
  const authEndpointEntries = Object.entries(authEndpoints)
    .map(([path, methods]) => {
      return `  '${path}': {\n    ${methods
        .map((m) => `${m.toLowerCase()}: true`)
        .join(';\n    ')};\n  }`
    })
    .join(';\n')

  return `
  /**
   * 認証が必要なAPIエンドポイントのマップ
   * OpenAPI定義のsecurityプロパティから自動生成
   */
  export interface AuthRequiredEndpoints {
  ${authEndpointEntries ? authEndpointEntries + ';' : ''}
  }
  
  /**
   * 指定されたパスとメソッドで認証が必要かどうかを判定する型
   */
  export type IsAuthRequired<
    P extends keyof AuthRequiredEndpoints,
    M extends string
  > = P extends keyof AuthRequiredEndpoints
    ? M extends keyof AuthRequiredEndpoints[P]
      ? AuthRequiredEndpoints[P][M] extends true
        ? true
        : false
      : false
    : false
  
  /**
   * 全パスに対して認証要件をチェックする型
   */
  export type RequiresAuthForPath<P extends string, M extends string> = 
    P extends keyof AuthRequiredEndpoints
      ? IsAuthRequired<P, M>
      : false
   `
}

const generateOpenAPI = async (): Promise<void> => {
  // 基本的な型定義を生成
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

  // 認証が必要なエンドポイントを抽出
  const authEndpoints = extractAuthRequiredEndpoints(openApiDocument as OpenAPIDocument)

  // 認証マップの型定義を生成
  const authTypeDefs = generateAuthTypeDefinitions(authEndpoints)
  console.log(authTypeDefs)

  fs.writeFileSync(tsOut, `${tsContent}\n${authTypeDefs}`, 'utf-8')
  console.log(`TypeScript definitions generated at ${tsOut}`)
}

generateOpenAPI()
