import React from 'react';

type FixBottom = {
  children: React.ReactNode;
};

const FullScreenBGC: React.FC<FixBottom> = ({ children }) => {
  return <div className='fixed bottom-0 left-0 w-full'>{children}</div>;
};

export default FullScreenBGC;
