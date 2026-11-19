module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // No reanimated/worklets plugin here: babel-preset-expo adds
    // react-native-worklets/plugin itself when it's installed.
  };
};
