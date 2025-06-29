module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules\/(?!(@firebase\/auth|@firebase\/app|@firebase\/firestore|@firebase\/storage|@firebase\/database|@firebase\/functions|@firebase\/messaging|@firebase\/app-check|@firebase\/remote-config|@firebase\/analytics|@firebase\/performance|@firebase\/app-types|@firebase\/component|@firebase\/logger|@firebase\/util|@firebase\/webchannel-wrapper|@firebase\/installations|@firebase\/auth-compat|@firebase\/firestore-compat|@firebase\/database-compat|@firebase\/storage-compat|@firebase\/functions-compat|@firebase\/analytics-compat|@firebase\/app-compat|@firebase\/app-check-compat|@firebase\/messaging-compat|@firebase\/performance-compat|@firebase\/remote-config-compat|@firebase\/app-types-compat|@firebase\/component-compat|@firebase\/logger-compat|@firebase\/util-compat|@firebase\/webchannel-wrapper-compat|@firebase\/installations-compat)).*/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  ignoreWarnings: [
    {
      module: /@firebase\/auth/,
      message: /Failed to parse source map/,
    },
  ],
};
