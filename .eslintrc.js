module.exports = {
  root: true,
  extends: 'airbnb-base',  
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  plugins: ['jest'],  
  env: {
    browser: true,
    'jest/globals': true,
  },
  'rules': {
    'import/extensions': ['error', 'always', {
      'js': 'never',
    }],
    'no-param-reassign': 0,
    'linebreak-style': 0,
  }
}
