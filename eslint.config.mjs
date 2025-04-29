import stylisticJs from "@stylistic/eslint-plugin-js";
import globals from "globals";

export default [
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      '@stylistic/js': stylisticJs
    },
    rules: {
      curly: "error",
      eqeqeq: "error",
      "no-use-before-define": ["error", { functions: false }],
      "no-undef": "error",
      "no-unused-vars": "error",
      "@stylistic/js/indent": ["error", 2],
      "comma-dangle": ["error", "never"]
    }
  },
  {files: ['test/**/*.js', 'test/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        ...globals.amd
      }
    }
  }
];
