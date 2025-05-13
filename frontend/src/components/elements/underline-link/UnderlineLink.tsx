import React from "react";
import styles from "./UnderlineLink.module.css";
import Link from "next/link";
import { colorCode } from "@/utils/tailwind-helper";

type UnderlineLinkProps = {
  label: string;
  href: string;
  underlineColor?: string;
  className?: string;
};

const UnderlineLink: React.FC<UnderlineLinkProps> = ({
  label,
  href,
  className,
  underlineColor = "text-black",
}) => {
  const cCode = colorCode(underlineColor);

  return (
    <Link
      href={href}
      className={`text-black font-bold py-2 px-4 ${styles["custom-underline"]} ${className}`}
      style={{ "--bg-color": cCode } as React.CSSProperties}
    >
      {label}
    </Link>
  );
};

export default UnderlineLink;
