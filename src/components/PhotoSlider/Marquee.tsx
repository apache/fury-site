import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // 控制滚动速度，单位为秒
  height?: string; // 控制 Marquee 高度
}

const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 10,
  height = "300px",
}) => {
  const speedValue = `${speed}s`;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height,
        width: "100%",
        background: "#f0f0f0", // 背景颜色
      }}
    >
      <div
        style={{
          display: "flex",
          width: "200%", // Ensure the width is enough to cover the full scroll
          animation: `marquee ${speedValue} linear infinite`,
        }}
      >
        <div style={{ display: "flex" }}>
          {children}
          {children} {/* Duplicate children for seamless effect */}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default Marquee;
