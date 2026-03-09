import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-[#FAF6EC] rounded-sm shadow-[0_4px_16px_rgba(10,36,99,0.05)] border border-[#C8B99A] ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
