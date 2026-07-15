require('dotenv').config();

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './',
        },
      },
    ],
    'transform-inline-environment-variables',
    'react-native-worklets/plugin', // Must be last
  ],
};
