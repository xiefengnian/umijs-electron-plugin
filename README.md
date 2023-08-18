# @umijs/plugin-electron

🔧 一个基于 umijs 插件体系与前端结合的、用于开发轻量桌面应用的的、简单快速的 electron 开发框架。


## 安装 Install

Using npm:

```bash
$ npm install --save-dev @umijs/plugin-electron
```

or using yarn:

```bash
$ yarn add @umijs/plugin-electron --dev
```

## 使用 Usage

基于 umi4 项目开始，请使用 `npm create umi` 初始化项目。

### 0. 添加 npm 镜像地址

受国内特殊网络环境影响，需要添加 npm 镜像。

```
# .npmrc
registry=https://registry.npmmirror.com
electron-mirror=https://registry.npmmirror.com/-/binary/electron/
electron-builder-binaries-mirror=https://registry.npmmirror.com/-/binary/electron-builder-binaries/
```

### 1. 配置 config.ts

```ts
{
  plugins : ['@umijs/plugin-electron'],
  electron :{},
}
```

### 2. 新增 electron 目录

新建文件：`src/main/index.ts`。因为 plugin-electron 会额外给你一些封装代码，所以目前你什么都不用干。

### 3. 启动

`$ npx umi dev`

### 4. 打包

`$ npx umi build`

应用产物将会出现在 ~/dist 目录下。

> 可以参照 example 目录开始

## 差距说明

为了实现热更新能力，部分和原生开发的差距需要注意：

1. require.resolve 不可用（因为 require 是伪造的）
2. app.on(event,listener) 监听 app 事件时，只有第一个 event 会被注册

## 文档说明

### 1. 约定式目录

```
./src/main
├── config.ts // 配置文件
├── forks     // 用于 child_process.fork 的代码文件目录
│   └── init_cli.ts
├── index.ts        // 入口文件
├── ipc       // ipc 通讯文件目录
│   └── index.ts
├── preload.ts      // 用于 browserWindow 的 preload 文件
├── tsconfig.json   // electron 部分的 tsconfig 文件
├── typing.d.ts     // 类型文件
└── util.ts         // 其他文件
```

约定的目录/文件说明：

1. 配置文件 config.ts（可选的 optional）

为了实现热更新能力，plugin-electron 代理了 browserWindow 实例的创建。因此，该实例创建的参数需要在 config.ts 定义。

该文件不会热更新，修改后必须重新命令行启动应用生效。

```ts
import { BrowserWindowConstructorOptions } from 'electron';

export default {
  browserWindow: {
    width: 400,
    height: 640,
    titleBarStyle: process.platform === 'win32' ? 'hidden' : 'hiddenInset',
    maximizable: false,
  } as BrowserWindowConstructorOptions,
};
```

2. forks 目录（可选的 optional）

同样，为了实现热更新能力，其他文件会在编译时有一些额外的代码注入。在 forks 目录下的文件将会跳过热更新的代码注入，仅进行 babel 的编译。

3. index.ts（必须的 required）

入口文件。

4. ipc（可选的 optional）

ipc 用于承载 ipc 通讯的文件，该目录下的文件会被自动加载到入口文件中。请不要在该文件中和别的文件互相引用。

5. preload.ts（可选的 optional）

用于 browserWindow 的 preload。

6. tsconfig.json（必须 required）

umi 项目使用的 ts 为 web 的。为了使用 node 的类型提示，需要在该目录下添加该文件保证开发体验。

建议根据自身版本安装对应 node 类型提示，例如 node14：`$ npm install @tsconfig/node14 --save-dev`

```json
{
  "extends": "@tsconfig/node14"
}
```

7. typing.d.ts（必须 required）

热更新能力会给所有模块注入 `getBrowserWindowRuntime` 方法获取当前的 browserWindow 实例。因此，需要额外的类型定义保证研发体验。

```ts
import { BrowserWindow } from 'electron';

declare global {
  export function getBrowserWindowRuntime(): BrowserWindow;
}
```

### 2. 插件配置

在 umi 中配置 electron 时，支持进行配置：

```ts
// src/config/config.ts
export default {
  electron: {},
};

type ElectronConfig = {
  builder: {
    targets: Map<Platform | Map<Arch | Array<String>>>; // https://www.electron.build/api/electron-builder
    config: Configuration; // https://www.electron.build/configuration/configuration
  };
  src: string;
  extraDevFiles: Record<string, string>;
};
```

1. builder

构建配置。

targets 和 config 详见 electron-builder 的文档。

example:

```ts
// .umirc
import { Platform, Arch } from '@umijs/plugin-electron'; // plugin 中转导出了 electron-builder 的 Programming Api，引入不同的 builder 会导致构建错误

// example: mac & windows
const targets = createTargets([Platform.MAC, Platform.WINDOWS]);

// example: mac m1
const targets = Platform.MAC.createTarget(['dmg'], Arch.arm64);

export default {
  electron: {
    builder: {
      targets: targets,
    },
  },
};
```

2. src

研发目录，默认 `src/main`。

3. 额外的开发阶段文件

需要向开发的临时目录添加的文件，比如热更新所需的证书。建议这样使用：

```ts
extraDevFiles: {
  'xxxx.js' : fs.readFileSync('xxxx.js','utf-8'),
}
```

## ISSUE

问题请在 issue 中反馈。