# 开发者说明

本项目基于 [father](https://github.com/umijs/father) 开发。

## 开始

1. 安装依赖并运行 dev 模式：

```shell
$ yarn && yarn dev
```

2. 从 example 目录开始：

```shell
$ cd example && yarn dev
```

3. 测试产物

位于 example 目录下：

```shell
$ yarn build
```

## 代码阅读提示

- 从 index.ts 开始，作为 umi 的 plugin 入口
- umi 的 onDevCompileDone 引导该脚手架进入 dev 模式
- umi 的 onBuildComplete 引导 electron-builder 进行打包
