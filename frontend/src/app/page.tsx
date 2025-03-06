import BackgroundImageText from "@/components/elements/background-image-text/BackgroundImageText";
import Header from "../components/layouts/header/Header";
import OutlineLink from "@/components/elements/outline-link/OutlineLink";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Header />
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start px-8 pt-32 pb-8 w-full">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-16 w-full">
          <div className="sm:w-1/2 flex justify-end">
            <Image
              src="/note-pen.svg"
              alt="Hero Image"
              width={400}
              height={300}
              className="h-auto"
            />
          </div>
          <div className="flex flex-col items-center sm:items-start sm:w-1/2">
            <BackgroundImageText
              as="h2"
              imagePath="/upper-arrow.svg"
              className="text-black text-4xl font-bold"
              imageSpace={{ dire: "right", space: 50 }}
            >
              文章要約
              <br />
              トレーニング
            </BackgroundImageText>
            <p className="text-black py-8 text-lg font-bold">
              理解力と伝える力は
              <br />
              ビジネスを行う上で必ず必要
            </p>
            <OutlineLink label="試してみる" />
          </div>
        </div>
      </main>
    </div>
  );
}
