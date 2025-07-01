export interface paths {
    "/user/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * ユーザー削除
         * @description 認証されたユーザーのアカウントを削除します。このAPIは認証が必要です。
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description 削除済みユーザーID */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                message: string;
                                deletedUserId: string;
                            };
                            message?: string;
                            meta?: {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description 不正リクエスト */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
                /** @description 認証が必要です */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
                /** @description サーバーエラー */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}

export type webhooks = Record<string, never>;

export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export type $defs = Record<string, never>;

export type operations = Record<string, never>;

  /**
   * 認証が必要なAPIエンドポイントのマップ
   * OpenAPI定義のsecurityプロパティから自動生成
   */
  export interface AuthRequiredEndpoints {
    '/user/delete': {
    delete: true;
  };
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
   