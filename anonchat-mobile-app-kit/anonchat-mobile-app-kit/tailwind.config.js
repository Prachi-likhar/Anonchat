/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          light: "#8B5CF6",
          dark: "#6D28D9",
        },
        background: {
          light: "#F7F7FB",
          dark: "#0E0F1A",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#161827",
        },
        "surface-2": {
          light: "#F0F1F7",
          dark: "#1E2033",
        },
        border: {
          light: "#E4E6F0",
          dark: "#2A2D45",
        },
        content: {
          light: "#12131F",
          dark: "#ECEDF7",
        },
        muted: {
          light: "#6B6F8A",
          dark: "#8E92B0",
        },
        online: "#22C55E",
        danger: "#EF4444",
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
