const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Explicitly set the project root for Metro FIRST
config.projectRoot = projectRoot;

// Watch the monorepo root and packages
config.watchFolders = [
  monorepoRoot,
  path.resolve(monorepoRoot, "packages"),
];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Export with NativeWind wrapper for Tailwind CSS support
module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
  configPath: "./tailwind.config.js",
});
