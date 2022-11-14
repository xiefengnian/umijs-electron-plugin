const lodash = require('lodash');
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.on('ready', () => {
  const bw = new BrowserWindow(
    lodash.merge(
      {
        ...require('./config.js'),
      },
      {
        webPreferences: {
          preload: join(__dirname, './dist/preload.js'),
        },
      }
    )
  );
  bw.loadFile(path.join(__dirname, './renderer.html')).then(() => {
    require('index.js');
  });
});
