import type { IApi } from 'umi';
import { join } from 'path';
import { generateEnvJson, regeneratePackageJson } from './utils';
import { buildElectron } from './buildElectron';
import { copyFileSync, writeFileSync } from 'fs';
import * as _ from 'lodash';
import { TMP_DIR_PRODUCTION, TMP_DIR } from './constants';
import { dev } from './dev';
import { PathUtil } from './utils/path';
import { build } from './build';

export type Mode = 'development' | 'production';

export const getTmpDir = (mode: Mode) => {
  return mode === 'development' ? TMP_DIR : TMP_DIR_PRODUCTION;
};

export default (api: IApi) => {
  // 配置
  api.describe({
    key: 'electron',
    config: {
      schema(joi) {
        return joi.object({
          src: joi.string(),
          builder: joi.object({
            targets: joi.any(),
            config: joi.object(),
          }),
          extraDevFiles: joi.object(),
        });
      },
      default: {},
    },
    enableBy: () => !!api.userConfig.electron,
  });

  let isFirstDevDone: boolean = true;

  api.onDevCompileDone(async () => {
    if (!isFirstDevDone) {
      return;
    }

    const currentMode: Mode = 'development';

    const {
      src = process.platform === 'win32' ? 'src\\main' : 'src/main',
      extraDevFiles = {},
    } = api.config.electron;

    const pathUtil = new PathUtil(src, getTmpDir(currentMode));

    generateEnvJson(currentMode);

    dev(
      pathUtil.getSrcDir(),
      pathUtil.getOutputDir(),
      api.appData.port,
      async () => {
        copyFileSync(
          join(__dirname, './template/entry-dev.js'),
          join(pathUtil.getOutputDir(), 'entry.js')
        );
        regeneratePackageJson(currentMode);
      }
    );

    const tmpDir = getTmpDir(currentMode);
    Object.keys(extraDevFiles).forEach((filename) => {
      writeFileSync(
        join(process.cwd(), tmpDir, filename),
        extraDevFiles[filename]
      );
    });

    isFirstDevDone = false;
  });

  api.onBuildComplete(async ({ err }) => {
    if (err) {
      return;
    }

    const currentMode: Mode = 'production';

    const { src = process.platform === 'win32' ? 'src\\main' : 'src/main' } =
      api.config.electron;

    // 打包超过五分钟则提示
    const timer = setTimeout(() => {
      console.log();
      console.log(
        '[umi electron] 打包时间过长，请尝试添加以下镜像到 .npmrc 中：\n' +
          'electron-mirror=https://registry.npmmirror.com/-/binary/electron/\n' +
          'electron-builder-binaries-mirror=https://registry.npmmirror.com/binary.html?path=electron-builder-binaries/'
      );
      console.log();
    }, 5 * 60 * 1000);

    build(src, getTmpDir(currentMode));

    generateEnvJson(currentMode);

    regeneratePackageJson(currentMode);

    clearTimeout(timer);
  });

  api.onBuildHtmlComplete(async () => {
    await buildElectron(api.config.electron.builder || {});
  });

  api.modifyConfig({
    fn: (initialValue) => {
      if (api.env === 'production') {
        return {
          ...initialValue,
          outputPath: `./${getTmpDir('production')}/renderer`,
          history: {
            type: 'hash',
          },
          publicPath: './',
        };
      }
      return initialValue;
    },
    stage: Infinity,
  });
};

export * from 'electron-builder';
