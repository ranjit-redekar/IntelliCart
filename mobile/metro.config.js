// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
// Sibling folders `mockdata/` and `shared/` live one directory up.
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so Metro sees changes to ../mockdata and ../shared.
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both the app and the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Hoisted deps don't get duplicated.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
