const LOGIN_PATH = '/signin';
const NEEDS_LOGIN_PATHS = [
  '/profile',
  '/dashboard',
];

/**
 * @param {{browser: import('puppeteer').Page, url: string}} ctx
 */
module.exports = async (browser, context) => {
  const page = await browser.newPage()
  const bypassSecret = process.env.VERCEL_BYPASS_SECRET
  await page.setExtraHTTPHeaders({ 'x-vercel-protection-bypass': bypassSecret })

  const baseUrl = process.env.PERFORMANCE_CHECK_BASE_URL
  const target = new URL(context.url, baseUrl);

  const isLogin = await isLoggedIn(browser)

  // テストの最終フローではログアウトしておく
  if (target.pathname === '/' && isLogin) {
    // ダッシュボードへ遷移
    await page.goto(new URL('/dashboard', baseUrl).toString(), { waitUntil: 'networkidle0' })
    // ログアウトボタン押下
    const userMenuBtn = await page.$('[data-testid="userMenuIcon"]')
    await userMenuBtn.click()
    const logoutBtn = await page.$('[data-testid="userMenuSignout"]')
    await logoutBtn.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    return
  }

  // まずアプリのトップへ（同一オリジンのCookieを得る）
  await page.goto(baseUrl, { waitUntil: 'networkidle0' })

  const needsLogin = NEEDS_LOGIN_PATHS.includes(target.pathname);

  if (needsLogin && !isLogin) {
    // ログインページへ遷移
    await page.goto(new URL(LOGIN_PATH, baseUrl).toString(), { waitUntil: 'networkidle0' })
    // メール・パスワードを入力（環境変数から）
    await page.type('input[name="email"]', process.env.LH_TEST_USER_EMAIL)
    await page.type('input[name="password"]', process.env.LH_TEST_USER_PASSWORD)

    // 送信して遷移完了を待つ
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ])
  }
};


/**
 * Supabase セッション Cookie が存在するかどうか確認する
 */
async function isLoggedIn(browser) {
  const cookies = await browser.cookies();

  return cookies.some(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );
}
