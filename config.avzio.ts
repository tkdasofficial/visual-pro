/**
 * =====================================
 *  Avzio Global Brand Configuration
 * =====================================
 * Root-level configuration for branding,
 * watermark control, and product identity.
 */

export const AVZIO_CONFIG = {
  company: {
    name: "Avzio",
    website: "https://visual-pro.netlify.app",
  },

  product: {
    name: "Visual Pro",
    tagline: "AI-Powered Image Generation Platform",
  },

  watermark: {
    enabled: true,

    type: "text", 
    // "text" | "logo"

    text: "Generated with Visual Pro by Avzio",

    logoPath: "/og-icon.png",

    position: "bottom-right", 
    // top-left | top-right | bottom-left | bottom-right | center

    opacity: 0.6,

    fontSize: 14,

    fontWeight: 500,

    textColor: "rgba(255,255,255,0.75)",

    backgroundColor: "rgba(0,0,0,0.35)",

    padding: "6px 12px",

    borderRadius: "8px",

    zIndex: 9999,
  },

  seo: {
    author: "Avzio",
    defaultTitle: "Visual Pro – AI Image Generation Platform",
    description:
      "Visual Pro is a professional AI-powered image generation platform developed by Avzio.",
  },
} as const;

export type AvzioConfigType = typeof AVZIO_CONFIG;
