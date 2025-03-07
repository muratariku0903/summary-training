import Image from "next/image";
import React from "react";
import BackgroundImageText from "@/components/elements/background-image-text/BackgroundImageText";
import Header from "../components/layouts/header/Header";
import OutlineLink from "@/components/elements/outline-link/OutlineLink";
import TextImageBlock from "@/components/elements/text-image-block/TextImageBlock";

export default function Home() {
  return (
    <div>
      <Header />
      <main className="flex flex-col row-start-2 items-center sm:items-start px-8 py-32 w-full">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-16 w-full pb-16">
          <div className="sm:w-1/2 flex justify-end">
            <Image
              src="/note-pen.svg"
              alt="ノートとペンのイラスト"
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
        <div className="w-full py-16">
          <div className="flex justify-center w-full">
            <h3 className="text-black font-bold text-xl">使い方</h3>
          </div>
          <TextImageBlock
            dire="left"
            text={{
              title: "要約",
              description: (
                <>
                  動画や音声、文章を題材に自分の言葉で要約。
                  <br />
                  時間制限や文字数などをカスタマイズすることで
                  <br />
                  目的に合わせたトレーニングが可能。
                </>
              ),
              imagePath: "/1.svg",
            }}
            image={
              <Image
                src="/pc-playing-video-audio.svg"
                alt="動画や音声を再生しているPC"
                width={400}
                height={300}
                className="h-auto"
              />
            }
            className="pt-32"
          />
          <TextImageBlock
            dire="right"
            text={{
              title: "要約",
              description: (
                <>
                  動画や音声、文章を題材に自分の言葉で要約。
                  <br />
                  時間制限や文字数などをカスタマイズすることで
                  <br />
                  目的に合わせたトレーニングが可能。
                </>
              ),
              imagePath: "/1.svg",
            }}
            image={
              <Image
                src="/pc-playing-video-audio.svg"
                alt="動画や音声を再生しているPC"
                width={400}
                height={300}
                className="h-auto"
              />
            }
            className="pt-32"
          />
        </div>
      </main>
    </div>
  );
}
