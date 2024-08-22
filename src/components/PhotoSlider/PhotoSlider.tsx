import React from "react";
import Marquee from "./Marquee";

const PhotoSlider: React.FC = () => {
  const photos = [
    "https://via.placeholder.com/400x300", // 大尺寸照片
    "https://via.placeholder.com/400x300",
    "https://via.placeholder.com/400x300",
    "https://via.placeholder.com/400x300",
    // Add more photo URLs as needed
  ];

  return (
    <Marquee speed={20} height="300px">
      {photos.map((photo, index) => (
        <div key={index} style={{ margin: "0 15px" }}>
          <img
            src={photo}
            alt={`Photo ${index + 1}`}
            style={{
              height: "300px",
              width: "auto",
              borderRadius: "10px",
              objectFit: "cover",
            }}
          />
        </div>
      ))}
    </Marquee>
  );
};

export default PhotoSlider;
