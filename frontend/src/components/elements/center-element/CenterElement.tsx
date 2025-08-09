import React from 'react';

type CenterElementProps = {
  children: React.ReactNode;
};

const CenterElement: React.FC<CenterElementProps> = ({ children }) => {
  return (
    <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
      {children}
    </div>
  );
};

export default CenterElement;
