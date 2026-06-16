import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#f8f4ee",
        linen: "#efe7da",
        sage: "#7f9275",
        moss: "#4b6043",
        lavender: "#b9a6c9",
        plum: "#7f4f79",
        blossom: "#b83b8b",
        ink: "#2e2b27"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        script: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "Aptos", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 22px 70px rgba(46, 43, 39, 0.10)"
      }
    }
  },
  plugins: []
} satisfies Config;
