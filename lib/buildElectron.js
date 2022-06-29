"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildElectron = void 0;

function _utils() {
  const data = require("@umijs/utils");

  _utils = function _utils() {
    return data;
  };

  return data;
}

function _electronBuilder() {
  const data = require("electron-builder");

  _electronBuilder = function _electronBuilder() {
    return data;
  };

  return data;
}

function _lodash() {
  const data = _interopRequireDefault(require("lodash"));

  _lodash = function _lodash() {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const builderConfig = require('./config/electron-builder.config');

const buildElectron = customBuilderConfig => {
  const PROJECT_DIR = (0, _path().join)(process.cwd(), _constants.TMP_DIR_PRODUCTION);
  const DEFAULT_OUTPUT = 'dist';
  const DEFAULT_RELATIVE_OUTPUT = (0, _path().join)('../', DEFAULT_OUTPUT);
  const builderConfigMerged = {
    config: _lodash().default.merge({
      directories: {
        output: DEFAULT_RELATIVE_OUTPUT
      },
      dmg: {
        title: `\${productName}-\${version}`,
        artifactName: `\${productName}-\${version}.\${ext}`
      },
      nsis: {
        artifactName: `\${productName}-setup-\${version}.\${ext}`
      }
    }, builderConfig, customBuilderConfig || {}),
    projectDir: PROJECT_DIR
  };

  const getOutput = () => {
    return _lodash().default.get(builderConfigMerged, ['config', 'directories', 'output'], DEFAULT_OUTPUT);
  };

  const output = getOutput();

  if (!output.startsWith('../')) {
    _lodash().default.set(builderConfigMerged, ['config', 'directories', 'output'], (0, _path().join)('../', output));
  }

  _utils().rimraf.sync((0, _path().join)(PROJECT_DIR, getOutput()));

  return (0, _electronBuilder().build)(builderConfigMerged);
};

exports.buildElectron = buildElectron;