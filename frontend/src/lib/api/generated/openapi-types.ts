export interface paths {
    "/auth/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 新規登録 */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    email: string;
                    password: string;
                    userName: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description ユーザーID */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            data: {
                                userId: string;
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