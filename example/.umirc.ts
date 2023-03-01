import { defineConfig } from 'umi';
import { Platform, Arch } from '../';

export default defineConfig({
  npmClient: 'yarn',
  plugins: [require.resolve('../')],
  electron: {
    builder: {
      targets: Platform.MAC.createTarget(['dmg'], Arch.arm64),
    },
  },
});
