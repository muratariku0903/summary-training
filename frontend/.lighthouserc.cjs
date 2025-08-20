// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.lhci' });

if (!process.env.PERFORMANCE_CHECK_BASE_URL) {
  throw Error('PERFORMANCE_CHECK_BASE_URL is required')
}

const baseUrl = process.env.PERFORMANCE_CHECK_BASE_URL
const paths = [
  '/',
  '/signup',
  '/signin',
  '/dashboard',
  '/profile',
  '/', // 最後の後処理用
];

const urls = paths.map(p => new URL(p, baseUrl).toString());

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
      settings: {
        // 認証が必要なら、短命Cookieを Secrets から入れる（任意）
        // extraHeaders: JSON.stringify({ Cookie: process.env.LHCI_AUTH_COOKIE || '' }),
      },
      // 計測前にログインスクリプトを実行
      puppeteerScript: './scripts/lh-login.cjs',
    },
    assert: {
      assertions: {
        // まずは落としすぎない運用で（warn）。安定後に error に格上げ
        'categories:performance': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
        // Core Web Vitals（厳守ライン）
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci-report',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
