"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

function _ora() {
  const data = _interopRequireDefault(require("ora"));

  _ora = function _ora() {
    return data;
  };

  return data;
}

var _fatherBuild = require("./fatherBuild");

var _electronManager = require("./electronManager");

var _utils = require("./utils");

var _buildElectron = require("./buildElectron");

function _fs() {
  const data = require("fs");

  _fs = function _fs() {
    return data;
  };

  return data;
}

function _lodash() {
  const data = require("lodash");

  _lodash = function _lodash() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _default = api => {
  // 配置
  api.describe({
    key: 'electron',
    config: {
      schema(joi) {
        return joi.object({
          src: joi.string(),
          builder: joi.object(),
          windowRequirePackages: joi.array(),
          extraDevFiles: joi.object()
        });
      },

      default: {}
    },
    enableBy: () => !!api.userConfig.electron
  }); // 渲染添加 babel 插件
  // umi 3

  if (api.modifyBabelOpts) {
    api.modifyBabelOpts(initialValue => {
      var _api$config$electron;

      initialValue.plugins.push([require.resolve('babel-plugin-import-to-window-require'), {
        packages: (((_api$config$electron = api.config.electron) === null || _api$config$electron === void 0 ? void 0 : _api$config$electron.windowRequirePackages) || []).concat(['electron'])
      }]);
      return initialValue;
    });
  } else {
    // umi 4
    // @ts-ignore
    api.addBeforeBabelPresets(() => {
      return () => {
        var _api$config$electron2;

        return {
          plugins: [[require.resolve('babel-plugin-import-to-window-require'), {
            packages: (((_api$config$electron2 = api.config.electron) === null || _api$config$electron2 === void 0 ? void 0 : _api$config$electron2.windowRequirePackages) || []).concat(['electron'])
          }]]
        };
      };
    });
  }

  let fatherBuildWatcher;
  let isFirstDevDone = true;
  api.onDevCompileDone( /*#__PURE__*/_asyncToGenerator(function* () {
    if (!isFirstDevDone) {
      return;
    }

    const currentMode = 'development';
    const spinner = (0, _ora().default)({
      prefixText: '[umi electron]',
      text: 'starting dev...\n'
    }).start();
    const _api$config$electron3 = api.config.electron,
          _api$config$electron4 = _api$config$electron3.src,
          src = _api$config$electron4 === void 0 ? 'src/main' : _api$config$electron4,
          _api$config$electron5 = _api$config$electron3.extraDevFiles,
          extraDevFiles = _api$config$electron5 === void 0 ? {} : _api$config$electron5;
    spinner.text = 'generate version.json...\n';
    (0, _utils.buildVersion)(currentMode);
    spinner.text = 'generate env.json...\n';
    (0, _utils.generateEnvJson)(currentMode);
    const electronManager = new _electronManager.ElectronProcessManager((0, _path().join)(process.cwd(), './.electron'));
    const fatherBuildCli = new _fatherBuild.FatherBuildCli({
      src,
      configPath: (0, _path().join)(__dirname, './config/father.js'),
      mode: 'development'
    });
    fatherBuildWatcher = yield fatherBuildCli.watch({
      onBuildComplete: () => {
        spinner.text = 'generate package.json...\n';
        (0, _utils.regeneratePackageJson)(currentMode);
        spinner.succeed('done~');
        electronManager === null || electronManager === void 0 ? void 0 : electronManager.start();
      },
      beforeBuild: () => {
        spinner.start('compiling...');
      }
    });
    spinner.text = 'generate entry file of development mode...\n';
    (0, _utils.generateEntryFile)((0, _utils.getEntry)('development', !!api.config.mpa), currentMode);
    const tmpDir = (0, _fatherBuild.getTmpDir)(currentMode);
    Object.keys(extraDevFiles).forEach(filename => {
      (0, _fs().writeFileSync)((0, _path().join)(process.cwd(), tmpDir, filename), extraDevFiles[filename]);
    });
    isFirstDevDone = false;
  }));
  api.onBuildComplete( /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* ({
      err
    }) {
      if (err) {
        return;
      }

      const currentMode = 'production';
      const _api$config$electron$ = api.config.electron.src,
            src = _api$config$electron$ === void 0 ? 'src/main' : _api$config$electron$;
      const fatherBuildCli = new _fatherBuild.FatherBuildCli({
        src,
        configPath: (0, _path().join)(__dirname, './config/father.js'),
        mode: currentMode
      }); // 打包超过五分钟则提示

      const timer = setTimeout(() => {
        console.log();
        console.log('[umi electron] 打包时间过长，请尝试添加以下镜像到 .npmrc 中：\n' + 'electron-mirror=https://registry.npmmirror.com/-/binary/electron/\n' + 'electron-builder-binaries-mirror=https://registry.npmmirror.com/binary.html?path=electron-builder-binaries/');
        console.log();
      }, 5 * 60 * 1000);
      const spinner = (0, _ora().default)({
        prefixText: '[umi electron]',
        text: 'starting build...\n'
      }).start();
      spinner.text = 'start build application'; // 支持 (pwd)/electron-builder.config.js 和 config.electron.builder

      let fileConfig = {};
      const customConfigFilePath = (0, _path().join)(process.cwd(), 'electron-builder.config.js');

      if ((0, _fs().existsSync)(customConfigFilePath)) {
        fileConfig = require((0, _path().join)(process.cwd(), 'electron-builder.config.js')) || {};
      }

      spinner.text = 'build main process code';
      yield fatherBuildCli === null || fatherBuildCli === void 0 ? void 0 : fatherBuildCli.build();
      spinner.text = 'build entry.js';
      (0, _utils.generateEntryFile)((0, _utils.getEntry)('production', !!api.config.mpa), currentMode);
      spinner.text = 'build version.json';
      (0, _utils.buildVersion)(currentMode);
      spinner.text = 'generate env.json\n';
      (0, _utils.generateEnvJson)(currentMode);
      spinner.text = 'regenerate package.json';
      (0, _utils.regeneratePackageJson)(currentMode);
      spinner.succeed('Preparations have been completed, ready to start electron-builder');
      yield (0, _buildElectron.buildElectron)((0, _lodash().merge)(fileConfig, api.config.electron.builder || {}));
      spinner.succeed('done');
      clearTimeout(timer);
    });

    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }());
  api.modifyConfig({
    fn: initialValue => {
      return _objectSpread(_objectSpread({}, initialValue), {}, {
        outputPath: `./${(0, _fatherBuild.getTmpDir)('production')}/renderer`,
        history: {
          type: 'hash'
        },
        publicPath: './'
      });
    },
    stage: Infinity
  });
};

exports.default = _default;