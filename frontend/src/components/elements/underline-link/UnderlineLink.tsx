import React from "react";
import styles from "./UnderlineLink.module.css";

type UnderlineLinkProps = {
  label: string;
  onClick?: () => void;
};

const UnderlineLink: React.FC<UnderlineLinkProps> = ({
  label,
  onClick,
}) => {
  return (
    <a
      className={`text-black font-bold py-2 px-4 ${styles["custom-underline"]}`}
      onClick={onClick}
    >
      {label}
    </a>
  );
};

export default UnderlineLink;
