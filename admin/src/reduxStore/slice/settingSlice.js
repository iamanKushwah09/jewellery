import { createSlice } from "@reduxjs/toolkit";

const getInitialSettings = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("globalSetting");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return [{ ...parsed, name: "globalSetting" }];
        }
      }
    }
  } catch (err) {
    console.error("Error reading globalSetting from localStorage", err);
  }
  return [];
};

const settingSlice = createSlice({
  name: "setting",
  initialState: {
    settingItem: getInitialSettings(),
  },
  reducers: {
    addSetting: (state, action) => {
      if (action.payload?.name === "globalSetting") {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("globalSetting", JSON.stringify(action.payload));
          }
        } catch (err) {
          console.error("Error saving globalSetting to localStorage", err);
        }
      }
      const existsItem = state.settingItem.find(
        (x) => x.name === action.payload.name
      );
      if (existsItem) {
        return {
          ...state,
          settingItem: state.settingItem.map((x) => {
            if (x.name === existsItem.name) {
              return action.payload;
            }
            return x;
          }),
        };
      } else {
        return {
          ...state,
          settingItem: [...state.settingItem, action.payload],
        };
      }
    },
    removeSetting: (state, action) => {
      return {
        ...state,
        settingItem: state.settingItem.filter((x) => x.name !== action.payload),
      };
    },

    clearSetting: (state) => {
      return {
        ...state,
        settingItem: [],
      };
    },
  },
});

export const { addSetting, removeSetting, clearSetting } = settingSlice.actions;

export default settingSlice.reducer;
