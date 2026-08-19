// Added for Jest. Metro previously fell back to its built-in default, which is
// equivalent to this — babel-preset-expo already handles the reactCompiler and
// typedRoutes experiments declared in app.json.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
