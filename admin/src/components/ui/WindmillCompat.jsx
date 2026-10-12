import React, { createContext, useState } from "react";
import myTheme from "@/assets/theme/myTheme";

export const WindmillContext = createContext({
  theme: myTheme,
  mode: "light",
  toggleMode: () => {},
});

export const ThemeContext = WindmillContext;

export const Windmill = ({
  children,
  theme = myTheme,
  usePreferences,
  ...props
}) => {
  const [mode, setMode] = useState("light");
  const toggleMode = () =>
    setMode((prev) => (prev === "dark" ? "light" : "dark"));

  const contextValue = {
    theme: theme || myTheme,
    mode,
    toggleMode,
  };

  return (
    <WindmillContext.Provider value={contextValue} {...props}>
      {children}
    </WindmillContext.Provider>
  );
};

export default { Windmill, WindmillContext, ThemeContext };
