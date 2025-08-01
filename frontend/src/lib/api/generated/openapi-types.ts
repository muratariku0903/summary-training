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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
    "/email/post": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * メール送信
         * @description 認証されたユーザーの操作に対して通知メールを送信します
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        pattern: "PASSWORD_CHANGE_NOTIFICATION" | "ACCOUNT_DELETE_NOTIFICATION";
                    };
                };
            };
            responses: {
                /** @description 成功失敗フラグ */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                message: boolean;
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/email/anon-post": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * メール送信
         * @description 匿名ユーザーの操作に対して通知メールを送信します
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        pattern: "PASSWORD_CHANGE_NOTIFICATION" | "ACCOUNT_DELETE_NOTIFICATION";
                        /** Format: email */
                        emailTo: string;
                    };
                };
            };
            responses: {
                /** @description 成功失敗フラグ */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                message: boolean;
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/idp/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * DescopeJWTをSupabase互換JWTに変換
         * @description DescopeJWTをSupabase互換JWTに変換
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        idpToken: string;
                    };
                };
            };
            responses: {
                /** @description 成功失敗フラグ */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                message: string;
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/password/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * パスワード検証
         * @description 入力されたパスワードが会員の値と一致するか検証します。このAPIは認証が必要です。
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        password: string;
                    };
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                valid: boolean;
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
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
                            code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER";
                            message: string;
                            details?: unknown;
                        };
                    };
                };
            };
        };
        delete?: never;
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
  '/email/post': {
    post: true;
  };
  '/auth/password/verify': {
    post: true;
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
   