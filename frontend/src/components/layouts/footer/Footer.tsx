import UnderlineLink from "@/components/elements/underline-link/UnderlineLink";

export default function Footer() {
  return (
    <footer className="text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-bold">株式会社サンプル</h2>
            <p className="text-sm">© 2025 Company Name. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <UnderlineLink
              label="問い合わせ"
              href="/contact"
              className="text-sm text-white"
              underlineColor="white"
            />
            <UnderlineLink
              label="プライバシーポリシー"
              href="/privacy"
              className="text-sm text-white"
              underlineColor="white"
            />
            <UnderlineLink
              label="利用規約"
              href="/terms"
              className="text-sm text-white"
              underlineColor="white"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
