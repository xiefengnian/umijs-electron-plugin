"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ElectronProcessManager = void 0;

function _electron() {
  const data = _interopRequireDefault(require("electron"));

  _electron = function _electron() {
    return data;
  };

  return data;
}

function _child_process() {
  const data = _interopRequireDefault(require("child_process"));

  _child_process = function _child_process() {
    return data;
  };

  return data;
}

function _yargsParser() {
  const data = _interopRequireDefault(require("yargs-parser"));

  _yargsParser = function _yargsParser() {
    return data;
  };

  return data;
}

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const args = (0, _yargsParser().default)(process.argv.slice(2));

class ElectronProcessManager {
  constructor(cwd = process.cwd()) {
    this.electronProcess = void 0;
    this.cwd = void 0;
    this.cwd = cwd;
  }

  start() {
    var _childProc$stdout, _childProc$stderr;

    this.kill();

    const childProc = _child_process().default.spawn(_electron().default, args.inspect ? [`--inspect=${args.inspect}`, this.cwd] : [this.cwd], {
      stdio: 'pipe',
      env: _objectSpread(_objectSpread({}, process.env), {}, {
        FORCE_COLOR: '1'
      }),
      cwd: this.cwd
    });

    childProc.on('error', err => {
      _utils.log.error('electron process error!');

      console.log(err); // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

      childProc.kill();
      process.exit(1);
    });
    (_childProc$stdout = childProc.stdout) === null || _childProc$stdout === void 0 ? void 0 : _childProc$stdout.pipe(process.stdout);
    (_childProc$stderr = childProc.stderr) === null || _childProc$stderr === void 0 ? void 0 : _childProc$stderr.pipe(process.stderr);
    this.electronProcess = childProc;
  }

  kill() {
    var _this$electronProcess;

    (_this$electronProcess = this.electronProcess) === null || _this$electronProcess === void 0 ? void 0 : _this$electronProcess.kill();
  }

}

exports.ElectronProcessManager = ElectronProcessManager;