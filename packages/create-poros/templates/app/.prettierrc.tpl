{
  "printWidth": 100,
  "singleQuote": true,
  "jsxSingleQuote": false,
  "trailingComma": "all",
  "proseWrap": "never",
  "overrides": [{ "files": ".prettierrc", "options": { "parser": "json" } }],
  "plugins": [
    "prettier-plugin-packagejson",
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],
  "importOrder": ["^(react|react-dom)$", "^([a-z]|@[a-z])", ".*"],
  "tailwindFunctions": ["clsx"]
}
