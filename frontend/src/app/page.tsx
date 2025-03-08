import React from "react";
import Image from "next/image";
import BackgroundImageText from "@/components/elements/background-image-text/BackgroundImageText";
import Header from "../components/layouts/header/Header";
import Footer from "@/components/layouts/footer/Footer";
import OutlineLink from "@/components/elements/outline-link/OutlineLink";
import TextImageBlock from "@/components/elements/text-image-block/TextImageBlock";
import FullScreenBGC from "@/components/elements/full-screen/FullScreenBGC";

export default function Home() {
  return (
    <div>
      <Header />
      <main className="flex flex-col row-start-2 items-center sm:items-start py-32 w-full">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-16 w-full px-8 pb-16">
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
        <FullScreenBGC backgroundColor="bg-gray-100">
          <div className="w-full px-8 py-16">
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
                title: "評価",
                description: (
                  <>
                    要約された文章をAIが評価。
                    <br />
                    文書構成などさまざまな観点からAIがアドバイスしてくれます。
                    <br />
                    評価観点も自分でカスタマイズ可能。
                  </>
                ),
                imagePath: "/2.svg",
              }}
              image={
                <Image
                  src="/robot-teacher.svg"
                  alt="ロボット先生"
                  width={400}
                  height={300}
                  className="h-auto"
                />
              }
              className="pt-32"
            />
            <TextImageBlock
              dire="left"
              text={{
                title: "ディスカッション",
                description: (
                  <>
                    AIが要約の内容について質問し、それに回答する形で議論を深め、自分の考えをさらにブラッシュアップ。
                    <br />
                    スピード感のあるディスカッションを実施できます。
                  </>
                ),
                imagePath: "/3.svg",
              }}
              image={
                <Image
                  src="/robot-discussion.svg"
                  alt="ロボットとディスカッション"
                  width={400}
                  height={300}
                  className="h-auto"
                />
              }
              className="pt-32"
            />
          </div>
        </FullScreenBGC>
        <div className="w-full px-8 py-16">
          <div className="flex justify-center w-full">
            <h3 className="text-black font-bold text-xl">メリット</h3>
          </div>
          <TextImageBlock
            dire="left"
            text={{
              title: "気軽に取り掛かれる",
              description: (
                <>
                  要約の題材はあらかじめ用意し、キャッチーなものを集めました。
                  <br />
                  気が向いた時にすぐに取り掛かれます。
                  <br />
                  <span className="text-sm italic">
                    ※要約の題材は日毎に更新される予定です。
                  </span>
                </>
              ),
              imagePath: "/1.svg",
            }}
            image={
              <Image
                src="/summary-topic.svg"
                alt="要約の題材"
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
              title: "理解力UP",
              description: (
                <>
                  動画や文章を理解して、自分の言葉で説明する訓練を通して理解力の向上を促します。
                </>
              ),
              imagePath: "/2.svg",
            }}
            image={
              <Image
                src="/flair.svg"
                alt="ひらめき"
                width={250}
                height={300}
                className="h-auto"
              />
            }
            className="pt-32"
          />
          <TextImageBlock
            dire="left"
            text={{
              title: "表現力の向上",
              description: (
                <>
                  要約力だけでなく、要約をもとに深掘りした思考を引き出すことで、表現力の向上が期待できます！
                </>
              ),
              imagePath: "/3.svg",
            }}
            image={
              <Image
                src="/expression-tool.svg"
                alt="表現ツール"
                width={400}
                height={300}
                className="h-auto"
              />
            }
            className="pt-32"
          />
        </div>
      </main>
      <FullScreenBGC backgroundColor="bg-gray-800">
        <Footer />
      </FullScreenBGC>
    </div>
  );
}
