module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: 'airbnb-base',
  'rules': {
    'import/extensions': ['error', 'always', {
      'js': 'never',
    }],
    'no-param-reassign': 0,
    'linebreak-style': 0,
  }
}
