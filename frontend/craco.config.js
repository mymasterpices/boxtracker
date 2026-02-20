const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      // Helps performance by ignoring unnecessary files during watch mode
      webpackConfig.watchOptions = {
        ignored: ["**/node_modules/**", "**/.git/**"],
      };
      return webpackConfig;
    },
  },
};
