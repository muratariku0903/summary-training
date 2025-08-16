// Node20, 依存なし（CJS）
const fs = require("fs");
const path = require("path");

const outDir = process.env["INPUT_PATH"] || "frontend";
const fileName = process.env["INPUT_FILENAME"] || ".env";
const outPath = path.join(outDir, fileName);

// ここで “アプリの .env キー” ← “上位 env のキー” を1か所に定義
const mappings = [
  ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"],
  ["NEXT_PUBLIC_SUPABASE_PROJECT_ID", "SUPABASE_PROJECT_ID"],
  ["NEXT_PUBLIC_DESCOPE_PROJECT_ID", "DESCOPE_PROJECT_ID"],

  ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  ["SUPABASE_JWT_SECRET", "SUPABASE_JWT_SECRET"],

  ["RESEND_API_KEY", "RESEND_API_KEY"],
  ["FROM_EMAIL", "FROM_EMAIL"],
  ["SUPPORT_EMAIL", "SUPPORT_EMAIL"],

  ["DESCOPE_ISSUER", "DESCOPE_ISSUER"],
  ["DESCOPE_AUDIENCE", "DESCOPE_AUDIENCE"],
  ["DESCOPE_JWKS_URI", "DESCOPE_JWKS_URI"],
  ["DESCOPE_MGMT_KEY", "DESCOPE_MGMT_KEY"],

  // ["E2E_ENABLED", "E2E_ENABLED"]
  // ["E2E_SECRET", "E2E_SECRET"]
];

const lines = mappings
  .map(([target, source]) => `${target}=${process.env[source] ?? ""}`)
  .join("\n") + "\n";

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines, { mode: 0o600 });
console.log(`Wrote dotenv to ${outPath}`);
