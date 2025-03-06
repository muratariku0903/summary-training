import React, { JSX } from "react";
import styles from "./BackgroundImageText.module.css";

type BackgroundImageTextProps = {
  as?: keyof JSX.IntrinsicElements;
  imagePath: string;
  children: React.ReactNode;
  className?: string;
  imageSpace: ImageSpace;
};

type ImageSpace = {
  dire: "left" | "right" | "top" | "bottom";
  space: number;
  unit?: "%" | "px";
};

const BackgroundImageText: React.FC<BackgroundImageTextProps> = ({
  as: Tag = "div",
  imagePath,
  children,
  className = "",
  imageSpace,
}) => {
  return (
    <Tag
      className={`${imageClassName(imageSpace.dire)} ${className}`}
      style={{
        backgroundImage: `url(${imagePath})`,
        ...imageStyle(imageSpace),
      }}
    >
      {children}
    </Tag>
  );
};

const imageClassName = (dire: ImageSpace["dire"]) => {
  switch (dire) {
    case "top":
      return styles.backgroundImageTextTop;
    case "right":
      return styles.backgroundImageTextRight;
    case "bottom":
      return styles.backgroundImageTextBottom;
    case "left":
      return styles.backgroundImageTextLeft;

    default:
      return "";
  }
};

const imageStyle = (imageSpace: ImageSpace): React.CSSProperties | null => {
  const { dire, space, unit = "px" } = imageSpace;

  switch (dire) {
    case "top":
      return { paddingTop: `${space}${unit}` };
    case "right":
      return { paddingRight: `${space}${unit}` };
    case "bottom":
      return { paddingBottom: `${space}${unit}` };
    case "left":
      return { paddingLeft: `${space}${unit}` };
    default:
      return null;
  }
};

export default BackgroundImageText;
