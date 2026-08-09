/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0A0B",
        surface: "#131316",
        raised: "#1B1B1E",
        hairline: "#2A2A2E",
        ink: "#F2F0EC",
        muted: "#9B9894",
        faint: "#5C5A57",
        amber: {
          DEFAULT: "#E8A840",
          deep: "#C8731A",
          glow: "rgba(232, 168, 64, 0.15)",
        },
        clay: "#C4694F",
        sage: "#8FA6A3",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "fade-up":    "fadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in":    "fadeIn 0.4s ease-out both",
        "slide-right":"slideRight 0.38s cubic-bezier(0.32, 0.72, 0, 1) both",
        "avatar-pop": "avatarPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "shimmer":    "shimmer 1.8s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in":   "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(48px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        avatarPop: {
          "0%":   { opacity: "0", transform: "scale(0.4)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 168, 64, 0)" },
          "50%":       { boxShadow: "0 0 28px 6px rgba(232, 168, 64, 0.12)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
