// Configuracion de Metro.
// expo-sqlite usa WebAssembly (wa-sqlite.wasm) en web; hay que registrar la
// extension .wasm como asset para que Metro la resuelva.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
