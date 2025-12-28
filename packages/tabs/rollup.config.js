import terser from '@rollup/plugin-terser';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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
  ? [`../../dist/tabs/v${version}/`, `../../dist/tabs/latest/`]
  : [`../../dist/tabs/latest/`];

// Custom plugin to copy CSS file to dist folders
function cssPlugin() {
  return {
    name: 'css-copy',
    writeBundle() {
      const cssSource = join(currentDir, 'src/styles.css');
      const cssContent = readFileSync(cssSource, 'utf-8');

      outputPaths.forEach((outputPath) => {
        const fullPath = join(currentDir, outputPath);
        mkdirSync(fullPath, { recursive: true });

        // Copy CSS file as tabs.css
        writeFileSync(join(fullPath, 'tabs.css'), cssContent, 'utf-8');
      });

      console.log('CSS file copied to dist');
    },
  };
}

// Helper function to create output configurations for a given path
function createOutputs(basePath) {
  // Create banner comment with package information
  const banner = `/*!
 * Tabs v${version}
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
      file: `${basePath}tabs.js`,
      format: 'iife',
      name: 'Tabs',
      sourcemap: true,
      banner: banner,
    },
    {
      file: `${basePath}tabs.min.js`,
      format: 'iife',
      name: 'Tabs',
      sourcemap: true,
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Configuration for the main tabs library bundle
const mainConfig = {
  input: 'src/tabs.js',
  output: outputPaths.flatMap(createOutputs),
  plugins: [cssPlugin()],
};

export default [mainConfig];
