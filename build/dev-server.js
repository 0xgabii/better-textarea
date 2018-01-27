const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const compiler = webpack(require('./webpack.dev.conf.js'));
const express = require('express');
const app = express();

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: '/',
  quiet: true
});

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  heartbeat: 2000
});

// serve webpack bundle output
app.use(devMiddleware);

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware);

app.listen(3000, () => console.log('Example app listening on port 3000!'))
