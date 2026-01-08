import { readFile } from 'fs/promises';
import path from 'path';
import { HtmlTagDescriptor, Plugin } from 'vite';
import { createHash } from 'crypto';

const basedir = process.cwd();

function generateProjectHash(): string {
  const projectPath = basedir;
  return createHash('md5').update(projectPath).digest('hex').substring(0, 8);
}

const PROJECT_HASH = generateProjectHash();
const MATCH_REGEX = /<script[^>]*src=(?:"|')(?:.*)-(\w+)\.js(?:"|')[^>]*>/;

interface PackageJson {
  version?: string;
  name?: string;
  [key: string]: any;
}

interface ResolvedConfig {
  env: {
    VITE_APP_TITLE?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface CustomConfigItem {
  content: string;
  styles?: string[];
  key: string;
}

interface UpdateConfig {
  checkInterval?: number;
  storageKeyPrefix?: string;
  enableVisibilityCheck?: boolean;
  enableAutoCheck?: boolean;
  updateConfirmMessage?: string;
  updateSuccessMessage?: string;
}

interface AutoVersionPluginOptions {
  systemTitle?: string;
  customConfigs?: CustomConfigItem[];
  isDisplayDefaultConfig?: boolean;
  updateConfig?: UpdateConfig;
}

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

const CompileTime = getCompileTime();

/**
 * 获取指定包的 package.json 内容
 *
 * @remarks
 *
 * @returns 解析后的 package.json 内容（JSON 对象）
 *
 * @throws 如果找不到或无法读取 package.json 文件，则抛出错误
 */
async function getPackageJson(): Promise<PackageJson> {
  const packageJsonPath = path.resolve(basedir, 'package.json');
  try {
    const packageJsonContent = await readFile(packageJsonPath, {
      encoding: 'utf-8',
    });
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson;
  } catch (error) {
    throw new Error(
      `无法读取或解析当前文件夹的package.json：${(error as Error).message}`,
    );
  }
}
async function generateScriptContent(
  opts: AutoVersionPluginOptions,
  version: string,
  compileTime: string,
  fingerprint: string,
): Promise<string> {
  const updateConfig = opts.updateConfig || {};
  const checkInterval = updateConfig.checkInterval || 60000;
  const storageKeyPrefix =
    updateConfig.storageKeyPrefix || `app_${PROJECT_HASH}`;
  const enableVisibilityCheck = updateConfig.enableVisibilityCheck !== false;
  const enableAutoCheck = updateConfig.enableAutoCheck === true;
  const updateConfirmMessage =
    updateConfig.updateConfirmMessage || '检测到新版本，是否立即更新？';
  const updateSuccessMessage =
    updateConfig.updateSuccessMessage || '更新成功，页面即将刷新...';

  const STORAGE_KEY = `${storageKeyPrefix}_fingerprint`;
  const matchStr = /<script[^>]*src=(?:"|')(?:.*)-(\w+)\.js(?:"|')[^>]*>/;

  let scriptContent = `window.version='${version}';window.version_date='${compileTime}';window.appFingerprint='${fingerprint}';`;

  opts.customConfigs?.forEach((item) => {
    if (item.styles) {
      scriptContent += `console.log.apply(console,${JSON.stringify([
        item.content,
        ...item.styles,
      ])});`;
    }
  });

  scriptContent += `(function(){const STORAGE_KEY='${STORAGE_KEY}';const CHECK_INTERVAL=${checkInterval};const ENABLE_VISIBILITY_CHECK=${enableVisibilityCheck};const ENABLE_AUTO_CHECK=${enableAutoCheck};const UPDATE_CONFIRM_MESSAGE='${updateConfirmMessage}';const UPDATE_SUCCESS_MESSAGE='${updateSuccessMessage}';const MATCH_REGEX=/${matchStr.source}/;if(window.appFingerprint)localStorage.setItem(STORAGE_KEY,window.appFingerprint);let checkIntervalId=null;let isVisible=true;const checkForUpdates=async()=>{if(!isVisible)return;try{const response=await fetch(location.href+'?t='+Date.now(),{cache:'no-cache',headers:{'pragma':'no-cache','cache-control':'no-cache'}});const html=await response.text();const jsMatch=html.match(MATCH_REGEX);if(jsMatch&&jsMatch[1]){const latestFingerprint=jsMatch[1];const storedFingerprint=localStorage.getItem(STORAGE_KEY);if(storedFingerprint&&storedFingerprint!==latestFingerprint){console.log('检测到版本更新:',storedFingerprint,'->',latestFingerprint);if(window.onAppUpdate){window.onAppUpdate();}else{if(confirm(UPDATE_CONFIRM_MESSAGE)){localStorage.setItem(STORAGE_KEY,latestFingerprint);alert(UPDATE_SUCCESS_MESSAGE);window.location.reload();}}}}}catch(error){console.error('检查更新失败:',error);}};const startChecking=()=>{if(checkIntervalId)clearInterval(checkIntervalId);checkIntervalId=setInterval(checkForUpdates,CHECK_INTERVAL);};const stopChecking=()=>{if(checkIntervalId){clearInterval(checkIntervalId);checkIntervalId=null;}};if(ENABLE_VISIBILITY_CHECK){const handleVisibilityChange=()=>{isVisible=!document.hidden;if(isVisible){checkForUpdates();if(ENABLE_AUTO_CHECK)startChecking();}else{stopChecking();}};document.addEventListener('visibilitychange',handleVisibilityChange);if(document.hidden){isVisible=false;}}if(ENABLE_AUTO_CHECK){startChecking();}window.checkForUpdates=checkForUpdates;})();`;

  return scriptContent;
}

export default function autoVersionPlugin(
  options: Partial<AutoVersionPluginOptions> = {},
): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-auto-version',
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async transformIndexHtml(html): Promise<HtmlTagDescriptor[]> {
      const packageJson = await getPackageJson();
      const version = packageJson?.version || '0.0.0';
      const compileTime = CompileTime;
      const sysTitle =
        config.env.VITE_APP_TITLE || options.systemTitle || '请配置systemTitle';
      const _customConfigs = options.customConfigs || [];

      // 从 HTML 中提取 JS 文件指纹
      let currentFingerprint;
      const htmlMatch = html.match(MATCH_REGEX);
      if (htmlMatch && htmlMatch[1]) {
        currentFingerprint = htmlMatch[1];
      }

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
          },
          {
            content: `%c${sysTitle}\n\n%c版本号：${version} %c编译时间：${compileTime}`,
            styles: [
              `font-size: 19px;padding-left: 10px;  color:#08979c;`,
              `font-size: 15px; line-height: 1.5;  font-family: "微软雅黑";color:#08979c;  padding-bottom: 5px;`,
              `font-size: 12px;padding-left: 10px;  line-height: 1.5;  font-family: "微软雅黑";color: #08979c;`,
            ],
            key: 'text2',
          },
          {
            content: `${version}`,
            key: 'version',
          },
          {
            content: `${compileTime}`,
            key: 'version_date',
          },
        ],
        isDisplayDefaultConfig: true,
      };
      const opts = { ...defaultOptions, ...options };
      if (opts.isDisplayDefaultConfig && defaultOptions.customConfigs) {
        _customConfigs.push(...defaultOptions.customConfigs);
        opts.customConfigs = _customConfigs;
      } else {
        opts.customConfigs = _customConfigs;
      }

      const scriptContent = await generateScriptContent(
        opts,
        version,
        compileTime,
        currentFingerprint,
      );

      return [
        {
          tag: 'script',
          children: scriptContent,
          injectTo: 'head',
        },
      ];
    },
  };
}
