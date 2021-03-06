import chalk from 'chalk';
import fs, { existsSync, mkdirSync, writeFileSync } from 'fs';
import path, { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { DependenciesJson } from '../types';
import { getTmpDir, Mode } from '../fatherBuild';

type LogFunctionType = (...args: string[]) => string;

export const log: {
  success: LogFunctionType;
  error: LogFunctionType;
  info: LogFunctionType;
  warn: LogFunctionType;
} = {
  success: (...args: string[]): string => {
    const msg = chalk.green('✔ success') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
  error: (...args: string[]): string => {
    const msg = chalk.red('✗ error') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
  info: (...args: string[]): string => {
    const msg = chalk.cyan('… info') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
  warn: (...args: string[]): string => {
    const msg = chalk.yellow('! warning') + ' ' + args.join('');
    console.log(msg);
    return args.join('');
  },
};

export const createVersionFile = (): {
  filename: string;
  fileContent: string;
} => {
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf-8',
  }).stdout.replace('\n', '');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require(path.resolve(process.cwd(), 'package.json'));
  const date = new Date().toUTCString();
  return {
    filename: 'version.json',
    fileContent: JSON.stringify({ commit, version, date }),
  };
};

export const buildVersion = (mode: Mode): void => {
  const { filename, fileContent } = createVersionFile();
  const outputPath = resolve(process.cwd(), getTmpDir(mode));
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }
  writeFileSync(resolve(outputPath, filename), fileContent, {
    encoding: 'utf-8',
  });
};

export const generateEntryFile = (fileContent: string, mode: Mode): void => {
  const outputPath = join(process.cwd(), getTmpDir(mode));
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }
  writeFileSync(join(outputPath, 'entry.js'), fileContent);
};

export const generateEnvJson = (mode: Mode) => {
  const outputPath = join(process.cwd(), getTmpDir(mode));
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }
  writeFileSync(join(outputPath, 'env.json'), JSON.stringify(process.env));
};

type GenEntryFunction = (
  mode: 'development' | 'production',
  isMpa: boolean | undefined,
) => string;
export const getEntry: GenEntryFunction = (mode, isMpa = false) => {
  if (mode === 'development') {
    return `module.exports = 'http://localhost:${process.env.PORT || '8000'}'`;
  } else {
    return isMpa
      ? `module.exports = \`file://\${require('path').resolve(__dirname,'./renderer/')}\``
      : `module.exports = \`file://\${require('path').resolve(__dirname,'./renderer/index.html')}\``;
  }
};

export const regeneratePackageJson = (mode: Mode) => {
  const userDependencies: DependenciesJson = require(join(
    process.cwd(),
    `${getTmpDir(mode)}/dependencies.json`,
  ));
  const originPkgJson = require(join(process.cwd(), './package.json'));
  const { dependencies = {}, devDependencies = {} } = originPkgJson;

  originPkgJson.main = './main/index.js';

  const originDependencies = { ...devDependencies, ...dependencies };

  // 删除原本的依赖，然后在原本的依赖中寻找使用的依赖的版本

  originPkgJson.dependencies = {};
  originPkgJson.devDependencies = {};

  userDependencies.all.forEach((dep) => {
    if (dep === 'electron') {
      return;
    }
    originPkgJson.dependencies[dep] = originDependencies[dep] || '*';
  });

  originPkgJson.devDependencies['electron'] =
    originDependencies['electron'] || '*';

  fs.writeFileSync(
    join(process.cwd(), `${getTmpDir(mode)}/package.json`),
    JSON.stringify(originPkgJson, undefined, 2),
    'utf-8',
  );
};
