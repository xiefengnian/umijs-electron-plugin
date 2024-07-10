const electron = require('electron');
const fs = require('fs');
const path = require('path');
const decache = require('clear-module');
const { join, parse } = require('path');
const _ = require('lodash');
const chokidar = require('chokidar');

const mPath = path.join(__dirname, './dist/index.js');

const { UMI_APP_PORT = '8000' } = process.env;

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
  const _ipcOnceMap = {};
  let _ipcHandleChannels = [];

  const _appUsingEvents = [];

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

    const _once = (filepath) => (channel, listener) => {
      if (!_ipcOnceMap[filepath]) {
        _ipcOnceMap[filepath] = {
          channels: [],
          listeners: [],
        };
      }
      _ipcOnceMap[filepath].channels.push(channel);
      _ipcOnceMap[filepath].listeners.push(listener);
      _ipcMain.once(channel, listener);
    };

    const _handle = (channel, listener) => {
      const handleResult = _ipcMain.handle(channel, listener);
      _ipcHandleChannels.push(channel);
      return handleResult;
    };

    const _handleOnce = (channel, listener) => {
      const handleResult = _ipcMain.handleOnce(channel, listener);
      _ipcHandleChannels.push(channel);
      return handleResult;
    };

    _on._hof = true;

    _context.electron = Object.assign(
      {
        ipcMain: {
          ..._ipcMain,
          on: _on,
          once: _once,
          handle: _handle,
          handleOnce: _handleOnce,
        },
        app: Object.assign(
          {
            on: (event, listener) => {
              if (_appUsingEvents.includes(event)) {
                return;
              }
              _appUsingEvents.push(event);
              electron.app.on(event, listener);
            },
          },
          electron.app
        ),
      },
      electron
    );

    return _context;
  };

  context.browserWindow = new electron.BrowserWindow(_config);

  await context.browserWindow.loadURL(`http://localhost:${UMI_APP_PORT}`);

  // init require modules start
  require(mPath).call(this, hackContext(context));

  let ipcFiles = [];
  const unmountAllIpc = () => {
    ipcFiles.forEach((ipcPath) => hotReplaceModule(ipcPath));
  };

  // init require modules end

  const clearEvents = (filepath) => {
    // clear on
    if (_ipcMainOnMap[filepath]) {
      const { channels, listeners } = _ipcMainOnMap[filepath];
      channels.forEach((channel, index) => {
        _ipcMain.removeListener(channel, listeners[index]);
      });
      _ipcMainOnMap[filepath] = undefined;
    }

    // clear once
    if (_ipcOnceMap[filepath]) {
      const { channels, listeners } = _ipcOnceMap[filepath];
      channels.forEach((channel, index) => {
        _ipcMain.removeListener(channel, listeners[index]);
      });
      _ipcOnceMap[filepath] = undefined;
    }

    // clear handle
    _ipcHandleChannels.forEach((channel) => {
      _ipcMain.removeHandler(channel);
    });
    _ipcHandleChannels = [];
  };

  const unmountModule = (filepath) => {
    clearEvents(filepath);
    decache(filepath);
  };
  const mountModule = (filepath) => {
    const _module = require(filepath);
    _module.call(this, hackContext(context));
  };

  const hotReplaceModule = (filepath) => {
    console.log('[hrm] ', filepath);
    unmountModule(filepath);
    mountModule(filepath);
  };

  const hotReplacePreload = () => {
    context.browserWindow.reload();
  };

  const src = path.join(__dirname, './dist');

  const isIpcFile = (filepath) => {
    return parse(filepath).dir === join(src, 'ipc') && /\.js$/.test(filepath);
  };

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
      } else if (isIpcFile(filepath)) {
        hotReplaceModule(filepath);
      } else if (filepath === mPath) {
        hotReplaceModule(mPath);
      } else {
        hotReplaceModule(mPath);
        unmountAllIpc();
      }
    })
    .on('unlink', (filepath) => {
      if (isIpcFile(filepath)) {
        ipcFiles = ipcFiles.filter((ipcPath) => ipcPath !== filepath);
        unmountModule(filepath);
      }
    })
    .on('add', (filepath) => {
      if (isIpcFile(filepath)) {
        ipcFiles.push(filepath);
        mountModule(filepath);
      }
    });
};

electron.app.on('ready', () => {
  main();
});
