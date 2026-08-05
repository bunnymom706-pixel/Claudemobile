/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cal: "#f59e0b",
        protein: "#ef4444",
        carbs: "#3b82f6",
        fat: "#10b981",
      },
    },
  },
  plugins: [],
};
