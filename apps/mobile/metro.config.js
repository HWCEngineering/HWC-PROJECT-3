const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo (so Metro can find files in node_modules at root)
config.watchFolders = [monorepoRoot];

// 2. Ensure the mobile workspace's own node_modules is checked FIRST,
//    so react@19.1.0 wins over the hoisted react@19.2.5.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force these critical packages to resolve from the mobile workspace
//    to prevent version mismatches between react and react-native renderer.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

module.exports = config;
