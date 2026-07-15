const { defineConfig } = require('eslint/config');
const reactNativeConfig = require('@react-native/eslint-config');

module.exports = defineConfig([
  reactNativeConfig,
  {
    ignores: ['dist/*', 'ios/*', 'android/*'],
  },
]);
