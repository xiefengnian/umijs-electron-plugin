"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTmpDir = exports.FatherBuildCli = void 0;

function _fs() {
  const data = require("fs");

  _fs = function _fs() {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireWildcard(require("path"));

  _path = function _path() {
    return data;
  };

  return data;
}

var _constants = require("./constants");

function _fatherBuild() {
  const data = _interopRequireDefault(require("father-build"));

  _fatherBuild = function _fatherBuild() {
    return data;
  };

  return data;
}

var _father = _interopRequireDefault(require("./config/father"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const getTmpDir = mode => {
  return mode === 'development' ? _constants.TMP_DIR : _constants.TMP_DIR_PRODUCTION;
};

exports.getTmpDir = getTmpDir;

class FatherBuildCli {
  constructor(_opts) {
    var _this = this;

    this.opts = void 0;

    this.getBuildArgs = () => {
      return _objectSpread(_objectSpread({}, (0, _father.default)(this.opts.mode)), {}, {
        silent: true,
        src: this.opts.src,
        output: this.opts.output
      });
    };

    this.watch = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(function* (opts) {
        const dispose = yield (0, _fatherBuild().default)({
          watch: true,
          beforeBuild: opts.beforeBuild,
          onBuildComplete: opts.onBuildComplete,
          cwd: process.cwd(),
          buildArgs: _this.getBuildArgs()
        });
        return {
          exit: () => {
            dispose();
          }
        };
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }();

    this.build = /*#__PURE__*/_asyncToGenerator(function* () {
      try {
        yield (0, _fatherBuild().default)({
          cwd: process.cwd(),
          buildArgs: _this.getBuildArgs()
        });
      } catch (error) {
        console.log(error);
      }
    });
    this.opts = {
      configPath: _opts.configPath,
      src: _opts.src || (0, _path().resolve)(process.cwd(), 'src', 'main'),
      output: _opts.output || (0, _path().resolve)(process.cwd(), getTmpDir(_opts.mode), 'main'),
      mode: _opts.mode
    };
  }

  static getUserConfig() {
    const userConfigPath = _path().default.resolve(process.cwd(), '.fatherrc.js');

    if ((0, _fs().existsSync)(userConfigPath)) {
      return (0, _fs().readFileSync)(userConfigPath, 'utf-8');
    }

    return;
  }

}

exports.FatherBuildCli = FatherBuildCli;