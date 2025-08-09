import React from 'react';

type MainProps = {
  children: React.ReactNode;
  className?: string;
};

const Main: React.FC<MainProps> = ({ children, className }) => {
  return (
    <main
      className={`flex-1 flex items-start justify-center p-8 ${
        className || ''
      }`}
    >
      {children}
    </main>
  );
};

export default Main;
