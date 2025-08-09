import React from 'react';
import styles from './FullScreenBGC.module.css';
import { colorCode } from '@/utils/tailwind-helper';

type FullScreenBGCProps = {
  children: React.ReactNode;
  backgroundColor: string;
  className?: string;
};

const FullScreenBGC: React.FC<FullScreenBGCProps> = ({
  children,
  backgroundColor,
  className,
}) => {
  return (
    <div
      className={`${styles['full-screen']} ${className || ''}`}
      style={
        { '--bg-color': colorCode(backgroundColor) } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default FullScreenBGC;
