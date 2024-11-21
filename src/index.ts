import { readFile } from 'fs/promises';
import path from 'path';
import { HtmlTagDescriptor, Plugin } from 'vite';

interface AutoVersionPluginOptions {
  systemTitle?: string;
  customConfigs: Array<any>;
  isDisplayDefaultConfig?: boolean;
}

const basedir = process.cwd();

function getTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear().toString();
  return `${year.substring(year.length - 2)}${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function getCompileTime(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(
    2,
    '0',
  )}:${String(t.getMinutes()).padStart(2, '0')}:${String(
    t.getSeconds(),
  ).padStart(2, '0')}`;
}

/**
 * 获取指定包的 package.json 内容
 *
 * @remarks
 *
 * @returns 解析后的 package.json 内容（JSON 对象）
 *
 * @throws 如果找不到或无法读取 package.json 文件，则抛出错误
 */
async function getPackageJson(): Promise<any> {
  const packageJsonPath = path.resolve(basedir, 'package.json');
  try {
    const packageJsonContent = await readFile(packageJsonPath, {
      encoding: 'utf-8',
    });
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson;
  } catch (error: any) {
    throw new Error(`无法读取或解析当前文件夹的package.json：${error.message}`);
  }
}
async function generateScriptContent(
  opts: AutoVersionPluginOptions,
  version: string,
  compileTime: string,
): Promise<string> {
  let scriptContent = `
    window.version = '${version}';
    window.version_date = '${compileTime}';`;
  // 自定义配置
  opts.customConfigs.forEach((item) => {
    // 样式
    if (item.styles) {
      scriptContent += `console.log.apply(console, ${JSON.stringify([
        item.content,
        ...item.styles,
      ])});`;
    }
    // 是否注入全局
    if (item.isInjectGlobal) {
      scriptContent += `window.${item.key} = ${item.value};`;
    }
  });

  return scriptContent;
}

export default function autoVersionPlugin(
  options: Partial<AutoVersionPluginOptions> = {},
): Plugin {
  let config;

  return {
    name: 'vite-plugin-auto-version',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async transformIndexHtml(): Promise<HtmlTagDescriptor[]> {
      const packageJson = await getPackageJson();
      const version = packageJson?.version;
      const compileTime = getCompileTime();
      const sysTitle =
        config.env.VITE_APP_TITLE || options.systemTitle || '请配置systemTitle';
      const _customConfigs = options.customConfigs || [];

      const defaultOptions: AutoVersionPluginOptions = {
        customConfigs: [
          {
            content: `%c 欢迎使用 %c${sysTitle} v${
              version + '.' + getTimestamp()
            } %c`,
            styles: [
              `background:#08979c;border:1px solid #08979c;padding: 4px 6px; border-radius: 4px 0 0 4px; color: #fff;`,
              `border:1px solid #08979c; padding: 4px 6px; border-radius: 0 4px 4px 0; color: #08979c;`,
              `background:transparent`,
            ],
            key: 'welcome',
            isInjectGlobal: false,
          },
          {
            content: `%c${sysTitle}\n\n%c版本号：${version} %c编译时间：${compileTime}`,
            styles: [
              `font-size: 19px;padding-left: 10px;  color:#08979c;`,
              `font-size: 15px; line-height: 1.5;  font-family: "微软雅黑";color:#08979c;  padding-bottom: 5px;`,
              `font-size: 12px;padding-left: 10px;  line-height: 1.5;  font-family: "微软雅黑";color: #08979c;`,
            ],
            key: 'text2',
            isInjectGlobal: false,
          },
          {
            content: `${version}`,
            isInjectGlobal: true,
            key: 'version',
          },
          {
            content: `${compileTime}`,
            isInjectGlobal: true,
            key: 'version_date',
          },
        ],
        isDisplayDefaultConfig: true,
      };
      const opts = { ...defaultOptions, ...options };
      if (opts.isDisplayDefaultConfig) {
        _customConfigs.push(...defaultOptions.customConfigs);
        opts.customConfigs = _customConfigs;
      } else {
        opts.customConfigs = _customConfigs;
      }

      const scriptContent = generateScriptContent(opts, version, compileTime);

      return [
        {
          tag: 'script',
          children: await scriptContent,
          injectTo: 'head',
        },
      ];
    },
  };
}
