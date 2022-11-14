import fs, { existsSync, mkdirSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import { spawnSync } from 'child_process';
import { DependenciesJson } from '../types';
import { getTmpDir, Mode } from '..';

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

export const generateEnvJson = (mode: Mode) => {
  const outputPath = join(process.cwd(), getTmpDir(mode));
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }
  writeFileSync(join(outputPath, 'env.json'), JSON.stringify(process.env));
};

export const regeneratePackageJson = (mode: Mode) => {
  const originPkgJson = require(join(process.cwd(), './package.json'));
  const { dependencies = {}, devDependencies = {} } = originPkgJson;

  originPkgJson.main = './entry.js';

  const originDependencies = { ...devDependencies, ...dependencies };

  // 删除原本的依赖，然后在原本的依赖中寻找使用的依赖的版本
  originPkgJson.dependencies = {};
  originPkgJson.devDependencies = {};

  if (mode === 'production') {
    const userDependencies: DependenciesJson = require(join(
      process.cwd(),
      `${getTmpDir(mode)}/dependencies.json`
    ));
    userDependencies.all.forEach((dep) => {
      if (dep === 'electron') {
        return;
      }
      originPkgJson.dependencies[dep] = originDependencies[dep] || '*';
    });
  }

  originPkgJson.devDependencies['electron'] =
    originDependencies['electron'] || '*';

  fs.writeFileSync(
    join(process.cwd(), `${getTmpDir(mode)}/package.json`),
    JSON.stringify(originPkgJson, undefined, 2),
    'utf-8'
  );
};
