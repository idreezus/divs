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
  return [
    {
      file: `${basePath}marquee.js`,
      format: 'iife',
      name: 'Marquee',
      globals: { gsap: 'gsap' },
    },
    {
      file: `${basePath}marquee.min.js`,
      format: 'iife',
      name: 'Marquee',
      globals: { gsap: 'gsap' },
      plugins: [terser()],
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
