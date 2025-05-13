import React from 'react';

const LogoSvg = ({ height = '20px', className = '', collapsed = false }) => {
  const logoText = collapsed ? "Pp" : "PersonalPod";
  const viewBoxWidth = collapsed ? 30 : 120;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${viewBoxWidth} 24`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'hidden' }}
    >
      <text
        x="0"
        y="16"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
        textAnchor="start"
        dominantBaseline="middle"
      >
        {logoText}
      </text>
    </svg>
  );
};

export default LogoSvg;