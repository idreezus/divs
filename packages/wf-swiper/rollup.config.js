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
  ? [`../../dist/wf-swiper/v${version}/`, `../../dist/wf-swiper/latest/`]
  : [`../../dist/wf-swiper/latest/`];

// Helper function to create output configurations for a given path.
function createOutputs(basePath) {
  // Create banner comment with package information
  const banner = `/*!
 * WFSwiper v${version}
 * ${description}
 * 
 * Part of <divs> by Idreeszus, a component library → (divs.idreezus.com)
 * 
 * (c) ${new Date().getFullYear()} ${author}
 * Released under ${license}
 */`;

  return [
    {
      file: `${basePath}wf-swiper.js`,
      format: 'iife',
      name: 'WFSwiper',
      globals: { swiper: 'Swiper' },
      sourcemap: true,
      banner: banner,
    },
    {
      file: `${basePath}wf-swiper.min.js`,
      format: 'iife',
      name: 'WFSwiper',
      globals: { swiper: 'Swiper' },
      sourcemap: true,
      plugins: [terser()],
      banner: banner,
    },
  ];
}

// Configuration for the main wf-swiper library bundle.
const mainConfig = {
  input: 'src/wf-swiper.js',
  output: outputPaths.flatMap(createOutputs),
  external: ['swiper'],
};

export default [mainConfig];
