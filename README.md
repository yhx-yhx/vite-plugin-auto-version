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
| systemTitle | `string` | `undefined` | 系统标题，默认为 package.json 中的 name |  
| isDisplayDefaultConfig | `boolean` | `true` | 是否显示默认配置 |
| sysTitleKey | `string` | `VITE_APP_TITLE` | 系统标题 key |
| vars | `Array<{ key: string; value?: string }>` | `[]` | 自定义变量 |
| styles | `Array<{ key: string; value: string }>` | `[]` | 自定义样式 |
| customMsg | `Array<{ msg: string; styles?: Array<string> | ExtractKey<stylesType> }>` | `[]` | 自定义消息 |
