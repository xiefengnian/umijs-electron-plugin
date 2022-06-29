"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.packageAnalyze = void 0;

function _path() {
  const data = require("path");

  _path = function _path() {
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

var _utils = require("../../utils");

function _chalk() {
  const data = _interopRequireDefault(require("chalk"));

  _chalk = function _chalk() {
    return data;
  };

  return data;
}

var _constants = require("../../constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ignoreDeps = ['electron', 'original-fs', 'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'crypto', 'debugger', 'dgram', 'diagnostics_channel', 'dns', 'domain', 'events', 'fs', 'global', 'http', 'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline', 'repl', 'report', 'stream', 'string_decoder', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'webcrypto', 'worker_threads', 'zlib', 'node:stream/web', // WebStream
'electron-lab'];

const packageAnalyze = opts => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const userPkg = require((0, _path().join)(process.cwd(), 'package.json'));

  const userDeps = Object.keys(userPkg.dependencies || {}); // eslint-disable-next-line @typescript-eslint/no-var-requires

  const analyzeResult = require((0, _path().join)(process.cwd(), `${_constants.TMP_DIR}/dependencies.json`));

  const analyzedDeps = (0, _lodash().difference)(analyzeResult.all, ignoreDeps);
  const unusedPkg = (0, _lodash().difference)(userDeps, analyzedDeps);
  const unInstallPkg = (0, _lodash().difference)(analyzedDeps, userDeps);

  if (unusedPkg.length) {
    _utils.log.warn(`found unused dependencies: ${unusedPkg.map(_ => `${_chalk().default.yellow(_)}`).join(', ')}, remove them to devDependencies reduce package size.`);

    if (opts === null || opts === void 0 ? void 0 : opts.throwWhileUnusedDependencies) {
      throw new Error('unused packages.');
    }
  }

  if (userDeps.includes('electron-lab')) {
    _utils.log.error('electron-lab should not in dependencies field!');

    throw new Error('invalid dependent.');
  }

  if (unInstallPkg.length) {
    _utils.log.error(`dependencies ${unInstallPkg.map(_ => _chalk().default.redBright(_)).join(', ')} not found!\ntry ${_chalk().default.green(`\`$ yarn add ${unInstallPkg.join(' ')}\``)} to fix this problem.\nor remove them:`);

    console.log(unInstallPkg.map(pkg => `${pkg}:\n${analyzeResult.deps[pkg].join('\n')}`).join('\n'));
    throw new Error('lost packages.');
  }
};

exports.packageAnalyze = packageAnalyze;