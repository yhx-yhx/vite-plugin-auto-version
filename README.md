# vite-plugin-auto-version

一个用于自动生成版本信息并在浏览器控制台显示的 Vite 插件。

## 功能特点

- 自动注入 package.json 中的版本号
- 显示构建时间戳
- 可自定义系统标题和消息
- 可配置控制台输出样式
- 支持自定义变量

## 安装

```bash
npm install @yhx392/vite-plugin-auto-version
```

## 使用

在 `vite.config.ts` 文件中引入插件：

```typescript
import pluginAutoVersion from '@yhx392/vite-plugin-auto-version';

export default defineConfig({
  plugins: [pluginAutoVersion()],
});
```

## 配置

<br>
| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| systemTitle | `string` | `undefined` | 系统标题,用于在控制台显示。如果未设置,将使用环境变量VITE_APP_TITLE或默认文案"请配置systemTitle" |
| isDisplayDefaultConfig | `boolean` | `true` | 是否显示默认的版本信息配置。设为false时将只显示自定义配置 |
| isGenerateVersionFile | `boolean` | `true` | 是否在构建时生成version.json文件,包含版本号、编译时间等信息 |
| customConfigs | `Array<CustomConfig>` | `[]` | 自定义配置数组,可以添加自定义的控制台输出内容。每个配置项包含以下字段:<br>- content: 显示的内容<br>- styles: 样式数组,支持CSS样式<br>- key: 配置的唯一标识<br>- isInjectGlobal: 是否注入到window对象 |
