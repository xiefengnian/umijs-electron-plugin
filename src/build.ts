import { generateDeps } from './utils';
import { getPkgName } from './utils/getPkgName';

const glob = require('glob');
const fs = require('fs');
const { parse, join } = require('path');
const babel = require('@babel/core');

const isWindows = process.platform === 'win32';

const createBrowserWindowProvider = (content) => `
"use strict";
const getBrowserWindowRuntime = ()=>{
 return require('electron').BrowserWindow.getAllWindows()[0]; 
}
${content.trim().replace(/"use strict";/g, '')}
`;

export const build = (srcDir: string, toDir: string) => {
  const deps = new Set(); // 搜集所有依赖
  const depsOfFile = {}; // 搜集文件依赖
  const filesOfDep = {}; // 搜集依赖所在文件

  const globPath = `${srcDir}/**/*`;

  glob
    .sync(isWindows ? globPath.replace(/\\/g, '/') : globPath)
    .forEach((filepath) => {
      filepath = isWindows ? filepath.replace(/\//g, '\\') : filepath;
      if (fs.statSync(filepath).isFile()) {
        const { base, ext, dir, name } = parse(filepath);

        const basePath = dir.replace(srcDir, '');

        let needProvider = false;

        if (['.js', '.ts'].includes(ext)) {
          if (!['preload', 'config'].includes(name)) {
            needProvider = true;
          }
        }

        if (/\.(js|ts|mjs)$/.test(ext)) {
          const { code } = babel.transformFileSync(filepath, {
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
            plugins: [
              [
                require('./babel-plugin-import-analyze'),
                {
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
                  },
                },
              ],
            ],
          });

          const outputDir = join(toDir, basePath);

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const outputFilename = join(outputDir, `${name}.js`);

          fs.writeFileSync(
            outputFilename,
            needProvider ? createBrowserWindowProvider(code) : code
          );
        } else {
          if (/tsconfig\.json$/.test(base) || /\.d\.ts$/.test(base)) {
          } else {
            const copyToDir = join(toDir, basePath);
            const copyToPath = join(copyToDir, base);
            if (!fs.existsSync(copyToDir)) {
              fs.mkdirSync(copyToDir, { recursive: true });
            }
            fs.copyFileSync(filepath, copyToPath);
          }
        }
      }
    });
  fs.copyFileSync(
    join(__dirname, './template/entry-prod.js'),
    join(toDir, 'entry.js')
  );
  generateDeps(deps, depsOfFile, filesOfDep);
};
