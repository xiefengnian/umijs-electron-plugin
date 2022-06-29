import { IApi } from 'umi';
import { join } from 'path';
import ora from 'ora';
import {
  FatherBuildCli,
  getTmpDir,
  Mode,
  WatchReturnType,
} from './fatherBuild';
import { ElectronProcessManager } from './electronManager';
import {
  buildVersion,
  generateEntryFile,
  generateEnvJson,
  getEntry,
  regeneratePackageJson,
} from './utils';
import { buildElectron } from './buildElectron';
import { existsSync, writeFileSync } from 'fs';
import { merge } from 'lodash';

export default (api: IApi) => {
  // 配置
  api.describe({
    key: 'electron',
    config: {
      schema(joi) {
        return joi.object({
          src: joi.string(),
          builder: joi.object(),
          windowRequirePackages: joi.array(),
          extraDevFiles: joi.object(),
        });
      },
      default: {},
    },
    enableBy: () => !!api.userConfig.electron,
  });

  // 渲染添加 babel 插件
  // umi 3
  if (api.modifyBabelOpts) {
    api.modifyBabelOpts((initialValue) => {
      initialValue.plugins.push([
        require.resolve('babel-plugin-import-to-window-require'),
        {
          packages: (api.config.electron?.windowRequirePackages || []).concat([
            'electron',
          ]),
        },
      ]);
      return initialValue;
    });
  } else {
    // umi 4
    // @ts-ignore
    api.addBeforeBabelPresets(() => {
      return () => {
        return {
          plugins: [
            [
              require.resolve('babel-plugin-import-to-window-require'),
              {
                packages: (
                  api.config.electron?.windowRequirePackages || []
                ).concat(['electron']),
              },
            ],
          ],
        };
      };
    });
  }

  let fatherBuildWatcher: WatchReturnType | undefined;

  let isFirstDevDone: boolean = true;

  api.onDevCompileDone(async () => {
    if (!isFirstDevDone) {
      return;
    }

    const currentMode: Mode = 'development';

    const spinner = ora({
      prefixText: '[umi electron]',
      text: 'starting dev...\n',
    }).start();
    const { src = 'src/main', extraDevFiles = {} } = api.config.electron;
    spinner.text = 'generate version.json...\n';
    buildVersion(currentMode);

    spinner.text = 'generate env.json...\n';
    generateEnvJson(currentMode);
    const electronManager = new ElectronProcessManager(
      join(process.cwd(), './.electron'),
    );
    const fatherBuildCli = new FatherBuildCli({
      src,
      configPath: join(__dirname, './config/father.js'),
      mode: 'development',
    });
    fatherBuildWatcher = await fatherBuildCli.watch({
      onBuildComplete: () => {
        spinner.text = 'generate package.json...\n';
        regeneratePackageJson(currentMode);
        spinner.succeed('done~');
        electronManager?.start();
      },
      beforeBuild: () => {
        spinner.start('compiling...');
      },
    });
    spinner.text = 'generate entry file of development mode...\n';
    generateEntryFile(getEntry('development', !!api.config.mpa), currentMode);

    const tmpDir = getTmpDir(currentMode);
    Object.keys(extraDevFiles).forEach((filename) => {
      writeFileSync(
        join(process.cwd(), tmpDir, filename),
        extraDevFiles[filename],
      );
    });

    isFirstDevDone = false;
  });

  api.onBuildComplete(async ({ err }) => {
    if (err) {
      return;
    }

    const currentMode: Mode = 'production';

    const { src = 'src/main' } = api.config.electron;
    const fatherBuildCli = new FatherBuildCli({
      src,
      configPath: join(__dirname, './config/father.js'),
      mode: currentMode,
    });

    // 打包超过五分钟则提示
    const timer = setTimeout(() => {
      console.log();
      console.log(
        '[umi electron] 打包时间过长，请尝试添加以下镜像到 .npmrc 中：\n' +
          'electron-mirror=https://registry.npmmirror.com/-/binary/electron/\n' +
          'electron-builder-binaries-mirror=https://registry.npmmirror.com/binary.html?path=electron-builder-binaries/',
      );
      console.log();
    }, 5 * 60 * 1000);

    const spinner = ora({
      prefixText: '[umi electron]',
      text: 'starting build...\n',
    }).start();

    spinner.text = 'start build application';
    // 支持 (pwd)/electron-builder.config.js 和 config.electron.builder
    let fileConfig = {};
    const customConfigFilePath = join(
      process.cwd(),
      'electron-builder.config.js',
    );
    if (existsSync(customConfigFilePath)) {
      fileConfig =
        require(join(process.cwd(), 'electron-builder.config.js')) || {};
    }

    spinner.text = 'build main process code';
    await fatherBuildCli?.build();

    spinner.text = 'build entry.js';
    generateEntryFile(getEntry('production', !!api.config.mpa), currentMode);

    spinner.text = 'build version.json';
    buildVersion(currentMode);

    spinner.text = 'generate env.json\n';
    generateEnvJson(currentMode);

    spinner.text = 'regenerate package.json';
    regeneratePackageJson(currentMode);

    spinner.succeed(
      'Preparations have been completed, ready to start electron-builder',
    );

    await buildElectron(merge(fileConfig, api.config.electron.builder || {}));

    spinner.succeed('done');
    clearTimeout(timer);
  });

  api.modifyConfig({
    fn: (initialValue) => {
      return {
        ...initialValue,
        outputPath: `./${getTmpDir('production')}/renderer`,
        history: {
          type: 'hash',
        },
        publicPath: './',
      };
    },
    stage: Infinity,
  });
};
