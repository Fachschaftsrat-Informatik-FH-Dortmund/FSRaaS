// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Paket-"exports"-Feld auflösen (in SDK 52 noch nicht Standard). Nötig für
// Pakete ohne klassisches "main", etwa expo-quick-actions; entspricht dem
// Standardverhalten ab SDK 53 und der Auflösung, die tsc bereits nutzt
// (moduleResolution: "bundler").
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
