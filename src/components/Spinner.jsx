import React from 'react';
import '../styles/Spinner.css'; // 스타일링을 위한 CSS 파일을 가정합니다

const Spinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

export default Spinner;
