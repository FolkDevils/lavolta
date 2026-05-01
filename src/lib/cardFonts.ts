/** Default card typography (matches `next/font` in `layout.tsx` for app shell). */
export const DEFAULT_FONT_SERIF = "Newsreader";
export const DEFAULT_FONT_SANS = "Red Hat Text";

/** Curated Google Font families — id is the exact family string for the CSS API. */
export const GOOGLE_FONT_OPTIONS: { id: string; label: string }[] = [
  { id: "Newsreader", label: "Newsreader" },
  { id: "Red Hat Text", label: "Red Hat Text" },
  { id: "Playfair Display", label: "Playfair Display" },
  { id: "EB Garamond", label: "EB Garamond" },
  { id: "Cormorant Garamond", label: "Cormorant Garamond" },
  { id: "Libre Baskerville", label: "Libre Baskerville" },
  { id: "Spectral", label: "Spectral" },
  { id: "Crimson Text", label: "Crimson Text" },
  { id: "Fraunces", label: "Fraunces" },
  { id: "Bodoni Moda", label: "Bodoni Moda" },
  { id: "Italiana", label: "Italiana" },
  { id: "Cinzel", label: "Cinzel" },
  { id: "Marcellus", label: "Marcellus" },
  { id: "Tenor Sans", label: "Tenor Sans" },
  { id: "Inter", label: "Inter" },
  { id: "DM Sans", label: "DM Sans" },
  { id: "Manrope", label: "Manrope" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { id: "Outfit", label: "Outfit" },
  { id: "Sora", label: "Sora" },
  { id: "Work Sans", label: "Work Sans" },
  { id: "Space Grotesk", label: "Space Grotesk" },
  { id: "Figtree", label: "Figtree" },
  { id: "Urbanist", label: "Urbanist" },
  { id: "Jost", label: "Jost" },
  { id: "Karla", label: "Karla" },
  { id: "Cabin", label: "Cabin" },
  { id: "Lato", label: "Lato" },
  { id: "Open Sans", label: "Open Sans" },
  { id: "Roboto", label: "Roboto" },
  { id: "Montserrat", label: "Montserrat" },
  { id: "Raleway", label: "Raleway" },
  { id: "Poppins", label: "Poppins" },
  { id: "Nunito", label: "Nunito" },
  { id: "Oswald", label: "Oswald" },
  { id: "Merriweather", label: "Merriweather" },
  { id: "Source Sans 3", label: "Source Sans 3" },
];

const SAFE_FONT = /^[a-zA-Z0-9\s\-]+$/;

/** Strip unsafe characters; fall back to defaults. */
export function sanitizeGoogleFontFamily(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim().slice(0, 72);
  if (!t || !SAFE_FONT.test(t)) return fallback;
  return t;
}

/** Stylesheet URL for two families (weights used on the card). */
export function buildGoogleFontsStylesheetHref(serif: string, sans: string): string {
  const s = encodeURIComponent(sanitizeGoogleFontFamily(serif, DEFAULT_FONT_SERIF));
  const n = encodeURIComponent(sanitizeGoogleFontFamily(sans, DEFAULT_FONT_SANS));
  return `https://fonts.googleapis.com/css2?family=${s}:wght@400;500;600;700&family=${n}:wght@400;500;600;700&display=swap`;
}
