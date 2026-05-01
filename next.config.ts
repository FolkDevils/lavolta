import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Directory containing this config file (= app root). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /** Helps tracing / tooling when the repo lives under a parent with its own lockfile. */
  outputFileTracingRoot: projectRoot,

  /**
   * Pin Turbopack’s root when a parent folder (e.g. $HOME) also has a
   * package-lock.json — otherwise resolution runs from the wrong tree and
   * `tailwindcss` fails with “Can't resolve … in '/Users/…'”.
   */
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
