import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const currentDir = dirname(fileURLToPath(import.meta.url));

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(currentDir, 'package.json'), 'utf-8')
);
const version = packageJson.version;
const description = packageJson.description;
const author = packageJson.author;
const license = packageJson.license;

// Determine build mode: 'release' builds to versioned folder + latest, 'dev' builds only to latest
const isRelease = process.env.BUILD_MODE === 'release';

// Build output paths based on mode
// Dev mode: only latest/
// Release mode: both versioned folder and latest/
const outputPaths = isRelease
  ? [`../../dist/marquee/v${version}/`, `../../dist/marquee/latest/`]
  : [`../../dist/marquee/latest/`];

// Helper function to create output configurations for a given path
function createOutputs(basePath) {
  // Create banner comment with package information
  const banner = `/*!
 * Marquee v${version}
 * ${description}
 * 
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 * 
 * (c) ${new Date().getFullYear()} ${author}
 * Released under ${license}
 */
`;

  return [
    {
      file: `${basePath}marquee.js`,
      format: 'iife',
      name: 'Marquee',
      globals: { gsap: 'gsap' },
      banner: banner,
    },
    {
      file: `${basePath}marquee.min.js`,
      format: 'iife',
      name: 'Marquee',
      globals: { gsap: 'gsap' },
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Configuration for the main marquee library bundle
const mainConfig = {
  input: 'src/marquee.js',
  output: outputPaths.flatMap(createOutputs),
  external: ['gsap'],
};

export default [mainConfig];
