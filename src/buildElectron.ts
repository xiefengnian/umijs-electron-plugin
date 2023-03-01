import {
  build,
  CliOptions,
  Configuration,
  createTargets,
  Platform,
} from 'electron-builder';
import lodash from 'lodash';
import { join } from 'path';
import { TMP_DIR_PRODUCTION } from './constants';

type Platforms = 'win' | 'mac' | 'linux';

type UserConfig = {
  targets: Platforms[];
  config: Configuration;
};

export const buildElectron = (userConfig?: UserConfig) => {
  const { targets, config = {} } = userConfig || {};

  const builderTargets =
    (targets
      ?.map((target) => {
        switch (target) {
          case 'linux':
            return Platform.LINUX;
          case 'win':
            return Platform.WINDOWS;
          case 'mac':
            return Platform.MAC;
          default:
            console.log('[builder targets] unknown target: ', target);
            return null;
        }
      })
      .filter(Boolean) as Platform[]) || [];

  const PROJECT_DIR = join(process.cwd(), TMP_DIR_PRODUCTION);
  const DEFAULT_OUTPUT = 'dist';
  const DEFAULT_RELATIVE_OUTPUT = join('../', DEFAULT_OUTPUT);

  const builderConfigMerged: CliOptions = {
    config: lodash.merge(
      {
        directories: { output: DEFAULT_RELATIVE_OUTPUT },
        dmg: {
          title: `\${productName}-\${version}`,
          artifactName: `\${productName}-\${version}.\${ext}`,
        },
        nsis: {
          artifactName: `\${productName}-setup-\${version}.\${ext}`,
        },
      },
      {
        electronDownload: {
          mirror: 'https://registry.npmmirror.com/-/binary/electron/',
        },
        files: ['./**'],
      },
      config || {}
    ) as Configuration,
    projectDir: PROJECT_DIR,
    targets: createTargets(builderTargets),
  };

  const getOutput = () => {
    return lodash.get(
      builderConfigMerged,
      ['config', 'directories', 'output'],
      DEFAULT_OUTPUT
    );
  };

  const output = getOutput();

  if (!output.startsWith('..')) {
    lodash.set(
      builderConfigMerged,
      ['config', 'directories', 'output'],
      join('../', output)
    );
  }
  return build(builderConfigMerged);
};
