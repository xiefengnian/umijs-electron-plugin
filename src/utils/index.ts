import fs, { existsSync, mkdirSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import { DependenciesJson } from '../types';
import { getTmpDir, Mode } from '..';

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

export const generateDeps = (toGenerateDeps, depsOfFile, filesOfDep) => {
  writeFileSync(
    path.resolve(process.cwd(), `${getTmpDir('production')}/dependencies.json`),
    JSON.stringify(
      {
        all: Array.from(toGenerateDeps),
        files: Object.keys(depsOfFile).reduce((memo, current) => {
          return {
            ...memo,
            [current]: Array.from(depsOfFile[current]),
          };
        }, {}),
        deps: Object.keys(filesOfDep).reduce((memo, current) => {
          return {
            ...memo,
            [current]: Array.from(filesOfDep[current]),
          };
        }, {}),
      },
      null,
      2
    )
  );
};
