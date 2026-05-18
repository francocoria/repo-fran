const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// `getDefaultConfig` de SDK 54 ya detecta el monorepo (watchFolders +
// nodeModulesPaths) y resuelve la estructura de pnpm con la búsqueda
// jerárquica habilitada. No agregamos overrides manuales.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
