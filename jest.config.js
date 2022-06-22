/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|mjs?|tsx?|ts?)$",
    verbose: true,
    transform: {
        "^.+\\.jsx?$": "babel-jest",
        "^.+\\.mjs$": "babel-jest",
    },
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    coverageProvider: "v8",
    moduleFileExtensions: [
        "js",
        "mjs",
        //   "cjs",
        //   "jsx",
        //   "ts",
        //   "tsx",
        //   "json",
        //   "node"
    ],
}
