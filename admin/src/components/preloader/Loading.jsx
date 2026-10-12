import React, { useContext } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { ThemeCustomizerContext } from '@/context/ThemeCustomizerContext';

const Loading = ({ loading, color }) => {
  const themeContext = useContext(ThemeCustomizerContext);
  const activeColor =
    color ||
    themeContext?.primaryColor ||
    (typeof window !== "undefined" &&
      getComputedStyle(document.documentElement).getPropertyValue("--primary-color")?.trim()) ||
    "#845adf";

  return (
    <div className="text-lg text-center py-6">
      <ScaleLoader
        color={activeColor}
        loading={loading}
        height={25}
        width={3}
        radius={3}
        margin={4}
      />
    </div>
  );
};

export default Loading;
