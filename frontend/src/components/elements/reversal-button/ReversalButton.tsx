import React from "react";

type ReversalButtonProps = {
  label: string;
  onClick?: () => void;
};

const ReversalButton: React.FC<ReversalButtonProps> = ({ label, onClick }) => {
  return (
    <button
      className={`text-black font-bold py-2 px-4 rounded hover:bg-black hover:text-white`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default ReversalButton;
