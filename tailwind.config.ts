import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ExtreamSys Brand Colors (from logo analysis)
        brand: {
          navy: "#1E3A5F",        // Primary navy from logo
          "navy-light": "#2D5F8D", // Lighter navy accent
          "navy-dark": "#0F1E2F",  // Darker navy for dark mode
          blue: "#3B82F6",         // Accessible accent blue
          "blue-light": "#60A5FA", // Light mode accent
        },
        // Semantic colors for light/dark modes
        background: {
          light: "#FAFBFC",
          dark: "#0F172A",
        },
        foreground: {
          light: "#1E293B",
          dark: "#F1F5F9",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1E293B",
        },
        border: {
          light: "#E2E8F0",
          dark: "#334155",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        "glass-sm": "0 4px 16px 0 rgba(31, 38, 135, 0.1)",
        "bento": "0 10px 40px -10px rgba(30, 58, 95, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "glass-shimmer": "glassShimmer 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glassShimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
