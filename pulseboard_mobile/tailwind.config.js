module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    
    "./src/**/*.{js,jsx}"
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'cyber-green': '#00ff88',
        'cyber-cyan': '#00ffff',
        'cyber-red': '#ff0000',
      },
    },
  },
  darkMode: "class",
  plugins: [],
}