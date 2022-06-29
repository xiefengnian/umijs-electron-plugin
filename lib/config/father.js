"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const _require = require('path'),
      resolve = _require.resolve;

const _require2 = require('fs'),
      writeFileSync = _require2.writeFileSync;

const _require3 = require('../utils/getPkgName'),
      getPkgName = _require3.getPkgName;

const TMP_DIR = '.electron';
const TMP_DIR_PRODUCTION = '.electron-production';

const getTmpDir = mode => {
  return mode === 'development' ? TMP_DIR : TMP_DIR_PRODUCTION;
};

const deps = new Set(); // 搜集所有依赖

const depsOfFile = {}; // 搜集文件依赖

const filesOfDep = {}; // 搜集依赖所在文件

/**
 * @param {'production' | 'development'} mode
 * @param {Set} toGenerateDeps
 */

const generateDeps = (mode, toGenerateDeps) => {
  writeFileSync(resolve(process.cwd(), `${getTmpDir(mode)}/dependencies.json`), JSON.stringify({
    all: Array.from(toGenerateDeps),
    files: Object.keys(depsOfFile).reduce((memo, current) => {
      return _objectSpread(_objectSpread({}, memo), {}, {
        [current]: Array.from(depsOfFile[current])
      });
    }, {}),
    deps: Object.keys(filesOfDep).reduce((memo, current) => {
      return _objectSpread(_objectSpread({}, memo), {}, {
        [current]: Array.from(filesOfDep[current])
      });
    }, {})
  }, null, 2));
};

var _default = mode => ({
  entry: resolve(process.cwd(), 'src/main/index.ts'),
  cjs: {
    type: 'babel'
  },
  target: 'node',
  disableTypeCheck: true,
  extraBabelPlugins: [[require('../features/package-analyze/babel-plugin-import-analyze'), {
    onCollect: (filename, depName) => {
      let finalDepName = getPkgName(depName);

      if (!finalDepName) {
        return;
      }

      deps.add(finalDepName);

      if (!depsOfFile[filename]) {
        depsOfFile[filename] = new Set();
      }

      if (!filesOfDep[finalDepName]) {
        filesOfDep[finalDepName] = new Set();
      }

      filesOfDep[finalDepName].add(filename);
      depsOfFile[filename].add(finalDepName);
      generateDeps(mode, deps);
    }
  }]]
});

exports.default = _default;