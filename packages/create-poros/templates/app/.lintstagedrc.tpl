{
  "*.{md,json}": [
    "prettier --cache --write"
  ],
  "*.{js,jsx}": [
    "poros lint --fix --eslint-only",
    "prettier --cache --write"
  ],
  "*.{css,less}": [
    "poros lint --fix --stylelint-only",
    "prettier --cache --write"
  ],
  "*.ts?(x)": [
    "poros lint --fix --eslint-only",
    "prettier --cache --parser=typescript --write"
  ]
}
