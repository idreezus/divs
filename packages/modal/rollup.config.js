import terser from '@rollup/plugin-terser';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Determine the directory that contains this config file
const currentDir = dirname(fileURLToPath(import.meta.url));

// Read the package version to build versioned folders during release builds
const packageJson = JSON.parse(
  readFileSync(join(currentDir, 'package.json'), 'utf-8')
);
const version = packageJson.version;
const description = packageJson.description;
const author = packageJson.author;
const license = packageJson.license;

// Build output paths based on mode
// Dev mode: only latest/
// Release mode: both versioned folder and latest/
const isRelease = process.env.BUILD_MODE === 'release';
const outputPaths = isRelease
  ? [`../../dist/modal/v${version}/`, `../../dist/modal/latest/`]
  : [`../../dist/modal/latest/`];

// Helper function to create output configurations for a given path
function createOutputs(basePath) {
  // Create banner comment with package information
  const banner = `/*!
 * Modal v${version}
 * ${description}
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) ${new Date().getFullYear()} ${author}
 * Released under ${license}
 */
`;

  // Ensure directory exists
  mkdirSync(join(currentDir, basePath), { recursive: true });

  return [
    {
      file: `${basePath}modal.js`,
      format: 'iife',
      name: 'Modal',
      sourcemap: true,
      banner: banner,
    },
    {
      file: `${basePath}modal.min.js`,
      format: 'iife',
      name: 'Modal',
      sourcemap: true,
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Configuration for the main modal library bundle
const mainConfig = {
  input: 'src/modal.js',
  output: outputPaths.flatMap(createOutputs),
};

export default [mainConfig];
