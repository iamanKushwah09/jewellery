import React from "react";

const Main = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto bg-[#f0f1f7] dark:bg-[#111c43] px-4 pt-2.5 pb-6 md:px-6 md:pt-3 md:pb-8 2xl:px-8 2xl:pt-3.5 transition-colors duration-200">
      <div className="mx-auto max-w-screen-2xl w-full">
        {children}
      </div>
    </main>
  );
};


export default Main;
