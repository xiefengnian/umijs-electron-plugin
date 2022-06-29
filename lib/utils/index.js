"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.regeneratePackageJson = exports.log = exports.getEntry = exports.generateEnvJson = exports.generateEntryFile = exports.createVersionFile = exports.buildVersion = void 0;

function _chalk() {
  const data = _interopRequireDefault(require("chalk"));

  _chalk = function _chalk() {
    return data;
  };

  return data;
}

function _fs() {
  const data = _interopRequireWildcard(require("fs"));

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

function _child_process() {
  const data = require("child_process");

  _child_process = function _child_process() {
    return data;
  };

  return data;
}

var _fatherBuild = require("../fatherBuild");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const log = {
  success: (...args) => {
    const msg = _chalk().default.green('✔ success') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
  error: (...args) => {
    const msg = _chalk().default.red('✗ error') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
  info: (...args) => {
    const msg = _chalk().default.cyan('… info') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
  warn: (...args) => {
    const msg = _chalk().default.yellow('! warning') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  }
};
exports.log = log;

const createVersionFile = () => {
  const commit = (0, _child_process().spawnSync)('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf-8'
  }).stdout.replace('\n', ''); // eslint-disable-next-line @typescript-eslint/no-var-requires

  const _require = require(_path().default.resolve(process.cwd(), 'package.json')),
        version = _require.version;

  const date = new Date().toUTCString();
  return {
    filename: 'version.json',
    fileContent: JSON.stringify({
      commit,
      version,
      date
    })
  };
};

exports.createVersionFile = createVersionFile;

const buildVersion = mode => {
  const _createVersionFile = createVersionFile(),
        filename = _createVersionFile.filename,
        fileContent = _createVersionFile.fileContent;

  const outputPath = (0, _path().resolve)(process.cwd(), (0, _fatherBuild.getTmpDir)(mode));

  if (!(0, _fs().existsSync)(outputPath)) {
    (0, _fs().mkdirSync)(outputPath, {
      recursive: true
    });
  }

  (0, _fs().writeFileSync)((0, _path().resolve)(outputPath, filename), fileContent, {
    encoding: 'utf-8'
  });
};

exports.buildVersion = buildVersion;

const generateEntryFile = (fileContent, mode) => {
  const outputPath = (0, _path().join)(process.cwd(), (0, _fatherBuild.getTmpDir)(mode));

  if (!(0, _fs().existsSync)(outputPath)) {
    (0, _fs().mkdirSync)(outputPath, {
      recursive: true
    });
  }

  (0, _fs().writeFileSync)((0, _path().join)(outputPath, 'entry.js'), fileContent);
};

exports.generateEntryFile = generateEntryFile;

const generateEnvJson = mode => {
  const outputPath = (0, _path().join)(process.cwd(), (0, _fatherBuild.getTmpDir)(mode));

  if (!(0, _fs().existsSync)(outputPath)) {
    (0, _fs().mkdirSync)(outputPath, {
      recursive: true
    });
  }

  (0, _fs().writeFileSync)((0, _path().join)(outputPath, 'env.json'), JSON.stringify(process.env));
};

exports.generateEnvJson = generateEnvJson;

const getEntry = (mode, isMpa = false) => {
  if (mode === 'development') {
    return `module.exports = 'http://localhost:${process.env.PORT || '8000'}'`;
  } else {
    return isMpa ? `module.exports = \`file://\${require('path').resolve(__dirname,'./renderer/')}\`` : `module.exports = \`file://\${require('path').resolve(__dirname,'./renderer/index.html')}\``;
  }
};

exports.getEntry = getEntry;

const regeneratePackageJson = mode => {
  const userDependencies = require((0, _path().join)(process.cwd(), `${(0, _fatherBuild.getTmpDir)(mode)}/dependencies.json`));

  const originPkgJson = require((0, _path().join)(process.cwd(), './package.json'));

  const _originPkgJson$depend = originPkgJson.dependencies,
        dependencies = _originPkgJson$depend === void 0 ? {} : _originPkgJson$depend,
        _originPkgJson$devDep = originPkgJson.devDependencies,
        devDependencies = _originPkgJson$devDep === void 0 ? {} : _originPkgJson$devDep;
  originPkgJson.main = './main/index.js';

  const originDependencies = _objectSpread(_objectSpread({}, devDependencies), dependencies); // 删除原本的依赖，然后在原本的依赖中寻找使用的依赖的版本


  originPkgJson.dependencies = {};
  originPkgJson.devDependencies = {};
  userDependencies.all.forEach(dep => {
    if (dep === 'electron') {
      return;
    }

    originPkgJson.dependencies[dep] = originDependencies[dep] || '*';
  });
  originPkgJson.devDependencies['electron'] = originDependencies['electron'] || '*';

  _fs().default.writeFileSync((0, _path().join)(process.cwd(), `${(0, _fatherBuild.getTmpDir)(mode)}/package.json`), JSON.stringify(originPkgJson, undefined, 2), 'utf-8');
};

exports.regeneratePackageJson = regeneratePackageJson;