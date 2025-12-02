import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Determine the directory that contains this config file.
const currentDir = dirname(fileURLToPath(import.meta.url));

// Read the package version to build versioned folders during release builds.
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
  ? [`../../dist/theme-toggle/v${version}/`, `../../dist/theme-toggle/latest/`]
  : [`../../dist/theme-toggle/latest/`];

// Create banner comment with package information
const banner = `/*!
 * Theme Toggle v${version}
 * ${description}
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) ${new Date().getFullYear()} ${author}
 * Released under ${license}
 */
`;

// Helper function to create output configurations for headCode.js
function createHeadCodeOutputs(basePath) {
  return [
    {
      file: `${basePath}headCode.js`,
      format: 'iife',
      name: 'ThemeHeadCode',
      sourcemap: false,
      banner: banner,
    },
    {
      file: `${basePath}headCode.min.js`,
      format: 'iife',
      name: 'ThemeHeadCode',
      sourcemap: false,
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Helper function to create output configurations for themeManager.js
function createThemeManagerOutputs(basePath) {
  return [
    {
      file: `${basePath}themeManager.js`,
      format: 'iife',
      name: 'ThemeManager',
      sourcemap: true,
      banner: banner,
    },
    {
      file: `${basePath}themeManager.min.js`,
      format: 'iife',
      name: 'ThemeManager',
      sourcemap: true,
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Configuration for the headCode bundle (anti-flash script)
const headCodeConfig = {
  input: 'src/headCode.js',
  output: outputPaths.flatMap(createHeadCodeOutputs),
};

// Configuration for the themeManager bundle (main library)
const themeManagerConfig = {
  input: 'src/themeManager.js',
  output: outputPaths.flatMap(createThemeManagerOutputs),
};

export default [headCodeConfig, themeManagerConfig];
