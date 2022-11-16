const electron = require('electron');
const fs = require('fs');
const path = require('path');
const decache = require('clear-module');
const { join, parse } = require('path');
const _ = require('lodash');
const chokidar = require('chokidar');

const mPath = path.join(__dirname, './dist/index.js');

const main = async () => {
  const context = { browserWindow: null, electron: electron };

  let userConfig = {};

  if (fs.existsSync(join(__dirname, './dist/config.js'))) {
    userConfig = require('./dist/config').default;
  } else {
    console.log(`[config] user config not found`);
  }

  const _config = _.merge(userConfig.browserWindow || {}, {
    webPreferences: {
      preload: join(__dirname, './dist/preload.js'),
    },
  });

  const _ipcMain = electron.ipcMain;

  /**
   * {
   *   [filepath] : {
   *    channels: string[], // channels可能会重复，使用对应关系避免冲突
   *    listeners: function[],
   *   }
   * }
   */
  const _ipcMainOnMap = {};
  const _ipcHandleMap = {};

  const hackContext = (_context) => {
    const _on = (filepath) => (channel, listener) => {
      if (!_ipcMainOnMap[filepath]) {
        _ipcMainOnMap[filepath] = {
          channels: [],
          listeners: [],
        };
      }
      _ipcMainOnMap[filepath].channels.push(channel);
      _ipcMainOnMap[filepath].listeners.push(listener);
      _ipcMain.on(channel, listener);
    };
    _on._hof = true;

    _context.electron = {
      ...electron,
      ipcMain: {
        ..._ipcMain,
        on: _on,
        handle: (filepath) => (channel, listener) => {
          if (!_ipcHandleMap[filepath]) {
            _ipcHandleMap[filepath] = {
              channels: [],
              listeners: [],
            };
          }
          _ipcHandleMap[filepath].channels.push(channel);
          _ipcHandleMap[filepath].listeners.push(listener);
          return _ipcMain.handle(channel, listener);
        },
      },
    };
    return _context;
  };

  context.browserWindow = new electron.BrowserWindow(_config);

  await context.browserWindow.loadURL('http://localhost:8000');

  // init require modules start
  require(mPath).call(this, hackContext(context));

  try {
    fs.readdirSync(join(__dirname, './dist/ipc')).forEach((file) => {
      const ipcFilepath = join(__dirname, './dist/ipc', file);

      let ipc = require(ipcFilepath);

      ipc.call(this, hackContext(context));
    });
  } catch (error) {
    console.log(error);
  }

  // init require modules end

  const clearEvents = (filepath) => {
    if (_ipcMainOnMap[filepath]) {
      const { channels, listeners } = _ipcMainOnMap[filepath];
      channels.forEach((channel, index) => {
        _ipcMain.removeListener(channel, listeners[index]);
      });
      _ipcMainOnMap[filepath] = undefined;
    }
    if (_ipcHandleMap[filepath]) {
      const { channels, listeners } = _ipcHandleMap[filepath];
      channels.forEach((channel, index) => {
        _ipcMain.removeHandler(channel, listeners[index]);
      });
      _ipcHandleMap[filepath] = undefined;
    }
  };

  const hotReplaceModule = (filepath) => {
    clearEvents(filepath);
    decache(filepath);
    const _module = require(filepath);
    _module.call(this, hackContext(context));
  };

  const hotReplacePreload = () => {
    context.browserWindow.reload();
  };

  const src = path.join(__dirname, './dist');

  chokidar
    .watch(src, {
      usePolling: true,
    })
    .on('change', (filepath) => {
      if (join(src, 'preload.js') === filepath) {
        hotReplacePreload();
      } else if (join(src, 'config.js') === filepath) {
        // reload application
        console.log(
          '[info] config changed, restart application to take effect.'
        );
      } else if (
        parse(filepath).dir === join(src, 'ipc') &&
        /\.js$/.test(filepath)
      ) {
        hotReplaceModule(filepath);
      } else {
        // todo: 重载所有 ipc
        hotReplaceModule(mPath);
      }
    });
};

electron.app.on('ready', () => {
  main();
});
