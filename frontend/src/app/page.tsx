import Image from "next/image";
import Header from "../components/layouts/header/Header";

export default function Home() {
  return (
    <div>
      <Header />
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
      </main>
    </div>
  );
}
