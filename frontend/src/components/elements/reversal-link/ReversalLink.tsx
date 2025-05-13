import React from "react";
import styles from "./ReversalLink.module.css";

type ReversalLinkProps = {
  label: string;
  onClick?: () => void;
};

const ReversalLink: React.FC<ReversalLinkProps> = ({ label, onClick }) => {
  return (
    <a className={styles["reversal-link"]} onClick={onClick}>
      {label}
    </a>
  );
};

export default ReversalLink;
