// ── HEAVEN signature art style ──────────────────────────────────────────────
// Flagship Visual Pro aesthetic. The master image is used purely as a
// STYLE & AESTHETIC anchor (palette, volumetric lighting, cinematic depth),
// never as a subject, character or composition reference.

import { HEAVEN_REFERENCE_DATA_URL, HEAVEN_REFERENCE_PATH } from "./heaven-reference.ts";

export const HEAVEN_STYLE_KEY = "heaven";

export function isHeavenStyle(style?: string | null): boolean {
  return !!style && style.trim().toLowerCase() === HEAVEN_STYLE_KEY;
}

export const HEAVEN_POSITIVE_PROMPT = [
  "HEAVEN signature cinematic art style:",
  "ultra-detailed stylized 3D cinematic render, painterly realism,",
  "rich saturated colour grading with deep crimson, amber and teal accents,",
  "dramatic volumetric god-rays and atmospheric haze, warm golden-hour rim light,",
  "epic wide cinematic composition with strong depth layering and aerial perspective,",
  "soft bloom, subtle film grain, high dynamic range, crisp micro-detail,",
  "serene majestic mood, breathtaking scenery, masterpiece quality, 8K.",
].join(" ");

export const HEAVEN_NEGATIVE_PROMPT = [
  "flat lighting, dull washed-out colours, low contrast, muddy shadows,",
  "blurry, low resolution, pixelated, jpeg artifacts, oversharpened,",
  "distorted anatomy, extra limbs, deformed hands, disfigured faces,",
  "text, watermark, signature, logo, ui elements, frame, border,",
  "amateur snapshot, harsh flash photography, cluttered messy composition.",
].join(" ");

/** Style-anchor instruction sent alongside the master reference image. */
export const HEAVEN_REFERENCE_INSTRUCTION = [
  "The attached HEAVEN master image is an AESTHETIC STYLE REFERENCE ONLY.",
  "Copy its colour palette, volumetric lighting, atmosphere, contrast curve,",
  "render quality and cinematic depth.",
  "Do NOT copy its subjects, characters, objects, scenery or composition.",
].join(" ");

/** Extra rule when the user supplies their own image to transform. */
export const HEAVEN_TRANSFORM_INSTRUCTION = [
  "The user image is the CONTENT source: preserve its subjects, identity,",
  "pose, layout and composition exactly.",
  "Re-render it entirely in the HEAVEN aesthetic described above.",
].join(" ");

export interface HeavenPromptResult {
  prompt: string;
  negativePrompt: string;
  /** Master style reference as a data URL (always available offline). */
  referenceImage: string;
  referencePath: string;
}

/**
 * Build the full HEAVEN prompt.
 * @param userPrompt   what the user asked for
 * @param userNegative optional user negative prompt
 * @param hasUserImage true when transforming a user-supplied image
 */
export function buildHeavenPrompt(
  userPrompt: string,
  userNegative?: string | null,
  hasUserImage = false,
): HeavenPromptResult {
  const negativePrompt = [HEAVEN_NEGATIVE_PROMPT, userNegative?.trim()]
    .filter(Boolean)
    .join(" ");

  const prompt = [
    HEAVEN_POSITIVE_PROMPT,
    HEAVEN_REFERENCE_INSTRUCTION,
    hasUserImage ? HEAVEN_TRANSFORM_INSTRUCTION : "",
    `Scene: ${userPrompt.trim()}.`,
    `Avoid: ${negativePrompt}`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    prompt,
    negativePrompt,
    referenceImage: HEAVEN_REFERENCE_DATA_URL,
    referencePath: HEAVEN_REFERENCE_PATH,
  };
}

export { HEAVEN_REFERENCE_DATA_URL, HEAVEN_REFERENCE_PATH };
