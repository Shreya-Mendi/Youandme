/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Nunito"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
      colors: {
        cream: "#FBF9F4",
        ink: "#17150F",
        marker: "#FFE45C",
        mint: { DEFAULT: "#7DD8AC", soft: "#DFF6EA" },
        lavender: { DEFAULT: "#B79CF0", soft: "#ECE4FB" },
        pink: { DEFAULT: "#F58FB4", soft: "#FCE0EC" },
        peach: { DEFAULT: "#FFB088", soft: "#FFE7D8" },
        sky: { DEFAULT: "#8EC5FF", soft: "#DCEDFF" },
        butter: { DEFAULT: "#FFDD57", soft: "#FFF3C4" },
      },
      boxShadow: {
        sticker: "0 12px 30px -8px rgba(20,20,20,0.18)",
        "sticker-lg": "0 20px 40px -10px rgba(20,20,20,0.24)",
      },
      borderRadius: {
        sticker: "26px",
        "sticker-lg": "32px",
      },
    },
  },
  plugins: [],
};
