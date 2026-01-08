# vite-plugin-auto-version

一个用于自动生成版本信息、检测版本更新并在浏览器控制台显示的 Vite 插件。

## 功能特点

- 自动注入 package.json 中的版本号
- 显示构建时间戳
- 基于文件指纹的版本检测
- 自动检测版本更新并提示用户
- 使用 localStorage 存储版本指纹
- 页面可见性检测，避免无效轮询
- 可自定义系统标题和消息
- 可配置控制台输出样式
- 支持自定义变量
- 高度可配置的更新检测策略

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

### 基础使用

```typescript
import pluginAutoVersion from '@yhx392/vite-plugin-auto-version';

export default defineConfig({
  plugins: [
    pluginAutoVersion({
      systemTitle: '我的应用',
    }),
  ],
});
```

### 开启自动更新检测

```typescript
import pluginAutoVersion from '@yhx392/vite-plugin-auto-version';

export default defineConfig({
  plugins: [
    pluginAutoVersion({
      systemTitle: '我的应用',
      updateConfig: {
        enableAutoCheck: true,           // 开启自动轮询
        checkInterval: 30000,            // 30秒检查一次
        enableVisibilityCheck: true,     // 启用页面可见性检测
      },
    }),
  ],
});
```

### 自定义更新提示文案

```typescript
import pluginAutoVersion from '@yhx392/vite-plugin-auto-version';

export default defineConfig({
  plugins: [
    pluginAutoVersion({
      systemTitle: '我的应用',
      updateConfig: {
        enableAutoCheck: true,
        updateConfirmMessage: '发现新版本，是否立即刷新？',
        updateSuccessMessage: '正在更新，请稍候...',
      },
    }),
  ],
});
```

### 自定义 localStorage key 前缀

```typescript
import pluginAutoVersion from '@yhx392/vite-plugin-auto-version';

export default defineConfig({
  plugins: [
    pluginAutoVersion({
      systemTitle: '我的应用',
      updateConfig: {
        storageKeyPrefix: 'myapp',       // 自定义前缀
      },
    }),
  ],
});
```

### 手动检查更新

如果不开启自动轮询，可以在需要时手动调用检查更新：

```javascript
// 在浏览器控制台或代码中调用
window.checkForUpdates();
```

### 自定义更新回调

可以通过定义全局回调函数来自定义更新逻辑：

```javascript
// 在应用代码中定义
window.onAppUpdate = function() {
  // 自定义更新逻辑，例如显示自定义弹窗
  if (confirm('检测到新版本，是否立即更新？')) {
    window.location.reload();
  }
};
```

### 完整配置示例

```typescript
import pluginAutoVersion from '@yhx392/vite-plugin-auto-version';

export default defineConfig({
  plugins: [
    pluginAutoVersion({
      systemTitle: '我的应用',
      isDisplayDefaultConfig: true,
      customConfigs: [
        {
          content: '%c 自定义消息 %c',
          styles: [
            'background: #1890ff; color: #fff; padding: 4px 8px;',
            'background: transparent;',
          ],
          key: 'custom',
        },
      ],
      updateConfig: {
        enableAutoCheck: true,
        checkInterval: 30000,
        enableVisibilityCheck: true,
        storageKeyPrefix: 'myapp',
        updateConfirmMessage: '发现新版本，是否立即刷新？',
        updateSuccessMessage: '正在更新，请稍候...',
      },
    }),
  ],
});
```

## 工作原理

1. **版本指纹提取**：插件从打包后的 HTML 中提取 JS 文件的指纹（如 `index-DqqSvSZU.js` 中的 `DqqSvSZU`）
2. **版本存储**：将当前指纹存储到 localStorage 中
3. **版本检测**：定期（或手动）获取最新 HTML，提取新的指纹并与存储的指纹对比
4. **更新提示**：当检测到指纹不一致时，提示用户更新
5. **用户确认**：用户确认后，更新 localStorage 中的指纹并刷新页面

## 全局变量

插件会在全局注入以下变量：

| 变量名 | 类型 | 说明 |
| --- | --- | --- |
| `window.version` | `string` | 当前版本号 |
| `window.version_date` | `string` | 编译时间 |
| `window.appFingerprint` | `string` | 当前文件指纹 |
| `window.checkForUpdates` | `function` | 手动检查更新的函数 |
| `window.onAppUpdate` | `function` | 自定义更新回调函数（可选） |

## 配置

<br>
| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| systemTitle | `string` | `undefined` | 系统标题,用于在控制台显示。如果未设置,将使用环境变量VITE_APP_TITLE或默认文案"请配置systemTitle" |
| isDisplayDefaultConfig | `boolean` | `true` | 是否显示默认的版本信息配置。设为false时将只显示自定义配置 |
| customConfigs | `Array<CustomConfig>` | `[]` | 自定义配置数组,可以添加自定义的控制台输出内容。每个配置项包含以下字段:<br>- content: 显示的内容<br>- styles: 样式数组,支持CSS样式<br>- key: 配置的唯一标识 |
| updateConfig | `UpdateConfig` | `{}` | 更新检测配置，详见下方 UpdateConfig |

### UpdateConfig

更新检测配置对象，用于控制版本更新检测的行为。

<br>
| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| enableAutoCheck | `boolean` | `false` | 是否开启自动轮询检测更新。默认为false，需要手动调用`window.checkForUpdates()`检查更新 |
| checkInterval | `number` | `60000` | 自动轮询的间隔时间（毫秒），默认60秒 |
| enableVisibilityCheck | `boolean` | `true` | 是否启用页面可见性检测。启用后，页面失活时会暂停轮询，激活时恢复 |
| storageKeyPrefix | `string` | `app_{hash}` | localStorage 的 key 前缀，默认使用项目路径的 hash 值，避免不同项目间的 key 冲突 |
| updateConfirmMessage | `string` | `'检测到新版本，是否立即更新？'` | 检测到更新时的确认提示文案 |
| updateSuccessMessage | `string` | `'更新成功，页面即将刷新...'` | 用户确认更新后的成功提示文案 |
