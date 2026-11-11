/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studioBg: "#07070C",
        studioCard: "#11111A",
        studioCardHover: "#181824",
        studioBorder: "rgba(255, 255, 255, 0.08)",
        studioBorderBright: "rgba(255, 255, 255, 0.16)",
        accentPrimary: "#6366F1",
        accentViolet: "#A855F7",
        accentCyan: "#22D3EE",
        accentEmerald: "#10B981",
        accentAmber: "#F59E0B",
        brandCyan: "#22D3EE",
        brandMagenta: "#A855F7",
        brandGreen: "#10B981",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        studio: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        glowCyan: "0 0 20px rgba(34, 211, 238, 0.25)",
        glowViolet: "0 0 20px rgba(168, 85, 247, 0.25)",
      },
    },
  },
  plugins: [],
};
