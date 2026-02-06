import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';
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
  ? [`../../dist/scroll-fade/v${version}/`, `../../dist/scroll-fade/latest/`]
  : [`../../dist/scroll-fade/latest/`];

// Helper function to create output configurations for a given path
function createOutputs(basePath) {
  // Create banner comment with package information
  const banner = `/*!
 * ScrollFade v${version}
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
      file: `${basePath}scroll-fade.js`,
      format: 'iife',
      name: 'ScrollFade',
      sourcemap: true,
      banner: banner,
    },
    {
      file: `${basePath}scroll-fade.min.js`,
      format: 'iife',
      name: 'ScrollFade',
      sourcemap: true,
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Configuration for the main scroll-fade library bundle
const mainConfig = {
  input: 'src/scroll-fade.js',
  output: outputPaths.flatMap(createOutputs),
};

export default [mainConfig];
