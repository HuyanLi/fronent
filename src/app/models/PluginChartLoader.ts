/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Chart from './Chart';
import * as datartChartHelper from 'app/utils/chartHelper';
import { fetchPluginChart } from 'app/utils/fetch';
import { cond, Omit } from 'utils/object';
import { request2 } from 'utils/request';

const pureFuncLoader = ({ path, result }) => {
  if (/.js$/.test(path)) {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${result})`)()({
      dHelper: { ...datartChartHelper },
    });
  }
};

const iifeFuncLoader = ({ path, result }) => {
  if (/.iife.js$/.test(path)) {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return ${result}`)()({
      dHelper: { ...datartChartHelper },
    });
  }
};

class PluginChartLoader {
  async loadPlugins(paths: string[]) {
    let plugins: Chart[] = [];
    try {
      // 加载扩展ui组件
      let pluginFiles = require.context(
        'app/components/ChartGraph/michaelCharts',
        false,
        /.js$/,
      );
      pluginFiles.keys().forEach(pluginFileName => {
        // 加载组件文件
        const pluginConfig = pluginFiles(pluginFileName);
        if (!pluginConfig) {
          return;
        }
        // 获取组件信息
        const customPlugin = pluginConfig.default({
          dHelper: { ...datartChartHelper, request2, tranform: () => 1 },
        });

        // 转换组件对象
        const customPluginChar = this.convertToDatartChartModel(customPlugin);
        plugins.push(customPluginChar);
      });
    } catch (e) {
      console.error('ChartPluginLoader | plugin chart error: ', e);
      return null;
    }

    const loadPluginTasks = (paths || []).map(async (path, index) => {
      try {
        const result = await fetchPluginChart(path);
        if (!result) {
          return Promise.resolve(result);
        }

        /* Known Issue: file path only allow in src folder by create-react-app file scope limitation by CRA
         * Git Issue: https://github.com/facebook/create-react-app/issues/5563
         * Suggestions: Use es6 `import` api to load file and compatible with ES Modules
         */
        const customPlugin = cond(
          iifeFuncLoader,
          pureFuncLoader,
        )({ path, result });
        return this.convertToDatartChartModel(customPlugin);
      } catch (e) {
        console.error('ChartPluginLoader | plugin chart error: ', e);
        return null;
      }
    });
    const fromServer = await Promise.all(loadPluginTasks);
    return Promise.resolve(plugins.concat(fromServer as any));
  }

  convertToDatartChartModel(customPlugin) {
    const chart = new Chart(
      customPlugin.meta.id,
      customPlugin.meta.name,
      customPlugin.meta.icon,
      customPlugin.meta.requirements,
    );
    return Object.assign(chart, Omit(customPlugin, ['meta']));
  }
}
export default PluginChartLoader;
