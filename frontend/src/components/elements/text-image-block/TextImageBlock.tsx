import React, { JSX } from "react";
import BackgroundImageText from "../background-image-text/BackgroundImageText";

type TextImageBlockProps = {
  dire: "left" | "right";
  text: TextProps;
  image: React.ReactNode;
  className?: string;
};

type TextProps = {
  title: React.ReactNode;
  titleAs?: keyof JSX.IntrinsicElements;
  description: React.ReactNode;
  imagePath?: string;
};

const TextImageBlock: React.FC<TextImageBlockProps> = ({
  dire,
  text: { title, titleAs = "h3", description, imagePath },
  image,
  className = "",
}) => {
  const Tag = titleAs;
  let titleElement = (
    <Tag className="text-black text-xl font-bold">{title}</Tag>
  );
  if (imagePath) {
    titleElement = (
      <BackgroundImageText
        as={titleAs}
        imagePath={imagePath}
        className="text-black text-xl font-bold"
        imageSpace={{ dire: "left", space: 20, scale: "50%" }}
      >
        {title}
      </BackgroundImageText>
    );
  }

  const textElement = (
    <div className="flex flex-col justify-end items-center sm:w-1/2">
      <div>
        <div className="border border-black px-8 py-2 rounded-lg inline-block">
          {titleElement}
        </div>
      </div>
      <p className="pt-8 px-2 text-black text-lg leading-loose">
        {description}
      </p>
    </div>
  );

  const imageElement = (
    <div className="flex flex-col items-center  sm:w-1/2">{image}</div>
  );

  const left = dire === "left" ? textElement : imageElement;
  const right = dire === "left" ? imageElement : textElement;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center sm:items-start gap-8 w-full ${className}`}
    >
      {left}
      {right}
    </div>
  );
};

export default TextImageBlock;
