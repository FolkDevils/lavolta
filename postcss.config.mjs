import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Pin Tailwind’s `base` to this repo. The v4 PostCSS plugin defaults `base`
 * to process.cwd(); when cwd is your home folder (parent workspace / stray
 * ~/package-lock.json), you get "Can't resolve 'tailwindcss' in '/Users/…'".
 *
 * Use the string-key plugin form so Next does not bundle @tailwindcss/postcss
 * (importing it here breaks Turbopack with native lightningcss/oxide).
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: projectRoot,
    },
  },
};

export default config;
