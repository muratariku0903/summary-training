import React from "react";
import styles from "./OutlineLink.module.css";

type OutlineLinkProps = {
  label: string;
  onClick?: () => void;
};

const OutlineLink: React.FC<OutlineLinkProps> = ({ label, onClick }) => {
  return (
    <a className={styles["outline-link"]} onClick={onClick}>
      {label}
    </a>
  );
};

export default OutlineLink;
