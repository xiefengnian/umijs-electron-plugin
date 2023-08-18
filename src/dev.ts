const rimraf = require('rimraf');
const proc = require('child_process');
const electron = require('electron');
const fs = require('fs');
const chokidar = require('chokidar');
const babel = require('@babel/core');
const { join, parse } = require('path');
const glob = require('glob');

const isWindows = process.platform === 'win32';

const createContextProvider = (content: string, filepath: string) => `
"use strict";
module.exports = (context) => {
  if(context.electron.ipcMain.on._hof) {
    context.electron.ipcMain.on = context.electron.ipcMain.on("${
      isWindows ? filepath.replace(/\\/g, '\\\\') : filepath
    }");
    context.electron.ipcMain.once = context.electron.ipcMain.once("${
      isWindows ? filepath.replace(/\\/g, '\\\\') : filepath
    }");
  }

  return ((require, getBrowserWindowRuntime) => {
    const exports = {};
    \n
    ${content.trim().replace(/"use strict";/g, '')}
    \n
    return exports;
  })((moduleId) => {
    const __require = require;
    if (context[moduleId]) {
      return context[moduleId];
    }
    if(moduleId.startsWith('.')) {
      return __require(moduleId)(context);
    }
    return __require(moduleId);
  },()=>context.browserWindow)
};
`;

export const dev = (
  srcDir: string,
  outputDir: string,
  port: number,
  beforeStartApp: () => Promise<void>
) => {
  const tmpDir = outputDir;

  outputDir = join(tmpDir, 'dist');

  console.log(`[dev] src: ${srcDir}, output: ${outputDir}`);

  // 每次启动的时候应该清空输出目录

  rimraf.sync(outputDir);

  const initAllFile = new Set();

  const globPath = `${srcDir}/**/*`;

  glob
    .sync(isWindows ? globPath.replace(/\\/g, '/') : globPath)
    .forEach((filepath: string) => {
      if (fs.statSync(filepath).isFile()) {
        initAllFile.add(isWindows ? filepath.replace(/\//g, '\\') : filepath);
      }
    });

  const isTransformFile = (ext, base?) => {
    if (/\.d\.ts$/.test(base)) {
      return false;
    }
    if (/\.(js|ts|mjs)$/.test(ext)) {
      return true;
    }
    return false;
  };

  const getFileOutputInfo = (filepath, srcDir, toDir) => {
    const { base, ext, dir, name } = parse(filepath);
    const basePath = dir.replace(srcDir, '');
    const outputDir = join(toDir, basePath);
    if (isTransformFile(ext)) {
      return {
        dir: outputDir,
        filepath: join(outputDir, `${name}.js`),
      };
    }
    const copyToDir = join(toDir, basePath);
    const copyToPath = join(copyToDir, base);
    return {
      dir: copyToDir,
      filepath: copyToPath,
    };
  };

  const transformFile = (filepath, srcDir, toDir) => {
    const { base, ext, name, dir } = parse(filepath);

    const subDir = dir.replace(srcDir, '');

    let needProvider = false;

    if (['.js', '.ts'].includes(ext)) {
      // 预定 forks 作为子进程文件目录，不增加 provider
      if (subDir === '/forks' || subDir === '\\forks' /** windows */) {
        needProvider = false;
      } else if (!['preload', 'config'].includes(name)) {
        needProvider = true;
      }
    }

    if (isTransformFile(ext, base)) {
      const { code } = babel.transformFileSync(filepath, {
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        plugins: [],
      });

      const { dir, filepath: finalFilePath } = getFileOutputInfo(
        filepath,
        srcDir,
        toDir
      );

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        finalFilePath,
        needProvider ? createContextProvider(code, finalFilePath) : code
      );
    } else {
      if (/tsconfig\.json$/.test(base) || /\.d\.ts$/.test(base)) {
        console.log(`[ignore] ${filepath}`);
      } else {
        const { dir, filepath: finalFilePath } = getFileOutputInfo(
          filepath,
          srcDir,
          toDir
        );

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.copyFileSync(filepath, finalFilePath);
      }
    }
  };

  const startApp = () => {
    const electronProcess = proc.spawn(electron, [tmpDir], {
      stdio: 'pipe',
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        UMI_APP_PORT: port,
      },
      cwd: process.cwd(),
    });

    electronProcess.stdout.pipe(process.stdout);
    electronProcess.stderr.pipe(process.stderr);
  };

  chokidar
    .watch(srcDir, {
      usePolling: true,
    })
    .on('add', (path) => {
      if (initAllFile.has(path)) {
        console.log(`[init] ${path}`);
        initAllFile.delete(path);
        if (initAllFile.size === 0) {
          beforeStartApp().then(() => {
            startApp();
          });
        }
      } else {
        console.log(`[add] ${path}`);
      }

      transformFile(path, srcDir, outputDir);
    })
    .on('unlink', (path) => {
      console.log(`[unlink] ${path}`);
      const { filepath } = getFileOutputInfo(path, srcDir, outputDir);
      try {
        fs.unlinkSync(filepath);
      } catch (error) {}
    })
    .on('change', (path) => {
      console.log(`[change] ${path}`);
      transformFile(path, srcDir, outputDir);
    });
};
