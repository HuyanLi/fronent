/**
 * 自定义扩展折线树图
 * @param dHelper 构建参数
 * @returns 返回组件
 */

function PolylineTree({ dHelper }) {
  return {
    config: {
      datas: [
        {
          label: 'dimension',
          key: 'dimension',
          required: true,
          type: 'group',
          limit: [1, 999],
        },
        {
          label: 'metrics',
          key: 'metrics',
          required: true,
          type: 'aggregate',
          limit: 1,
        },
        {
          label: 'filter',
          key: 'filter',
          type: 'filter',
          allowSameField: true,
        },
      ],
      styles: [
        {
          label: 'label.title',
          key: 'label',
          comType: 'group',
          rows: [
            {
              label: 'label.showLabel',
              key: 'showLabel',
              default: true,
              comType: 'checkbox',
            },
            {
              label: 'label.position',
              key: 'position',
              comType: 'select',
              default: 'outside',
              options: {
                items: [
                  { label: '外侧', value: 'outside' },
                  { label: '内部', value: 'inside' },
                  { label: '中心', value: 'center' },
                ],
              },
            },
            {
              label: 'font',
              key: 'font',
              comType: 'font',
              default: {
                fontFamily: 'PingFang SC',
                fontSize: '12',
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#495057',
              },
            },
          ],
        },
        {
          label: 'breadcrumb.title',
          key: 'breadcrumb',
          comType: 'group',
          rows: [
            {
              label: 'breadcrumb.showBreadCrumb',
              key: 'showBreadCrumb',
              default: true,
              comType: 'checkbox',
            },
            {
              label: 'breadcrumb.position',
              key: 'position',
              comType: 'select',
              default: 'bottom',
              options: {
                items: [
                  { label: '上方', value: 'top' },
                  { label: '下方', value: 'bottom' },
                ],
              },
            },
          ],
        },
      ],
      settings: [],
      i18ns: [
        {
          lang: 'zh-CN',
          translation: {
            common: {
              showAxis: '显示坐标轴',
              inverseAxis: '反转坐标轴',
              lineStyle: '线条样式',
              borderStyle: '边框样式',
              borderType: '边框线条类型',
              borderWidth: '边框线条宽度',
              borderColor: '边框线条颜色',
              backgroundColor: '背景颜色',
              showLabel: '显示标签',
              unitFont: '刻度字体',
              rotate: '旋转角度',
              position: '位置',
              showInterval: '显示刻度',
              interval: '刻度间隔',
              showTitleAndUnit: '显示标题和刻度',
              nameLocation: '标题位置',
              nameRotate: '标题旋转',
              nameGap: '标题与轴线距离',
              min: '最小值',
              max: '最大值',
            },
            label: {
              title: '标签',
              showLabel: '显示标签',
              position: '位置',
            },
            legend: {
              title: '图例',
              showLegend: '显示图例',
              type: '图例类型',
              selectAll: '图例全选',
              position: '图例位置',
            },
            data: {
              color: '颜色',
              colorize: '配色',
            },
            stack: {
              title: '堆叠',
              enable: '开启',
              percentage: '百分比',
              enableTotal: '显示总计',
            },
            bar: {
              title: '条形图',
              enable: '开启横向展示',
              radius: '边框圆角',
              width: '柱条宽度',
              gap: '柱间隙',
            },
            xAxis: {
              title: 'X轴',
            },
            yAxis: {
              title: 'Y轴',
            },
            splitLine: {
              title: '分割线',
              showHorizonLine: '显示横向分割线',
              showVerticalLine: '显示纵向分割线',
            },
            reference: {
              title: '参考线',
              open: '点击参考线配置',
            },
            cache: {
              title: '数据处理',
            },
            breadcrumb: {
              title: '面包屑',
              showBreadCrumb: '显示面包屑',
              position: '位置',
            },
          },
        },
      ],
    },
    isISOContainer: 'polylineTree',
    dependency: ['/custom-chart-plugins/temp/echarts_5.0.2.js'],
    meta: {
      id: 'polar-bar-chart',
      name: '折线树图',
      icon: 'chart',
      requirements: [
        {
          group: [1, 999],
          aggregate: 1,
        },
      ],
    },

    onMount(options, context) {
      this.globalContext = context;
      if ('echarts' in context.window) {
        // 组件对象初始化
        this.chart = context.window.echarts.init(
          context.document.getElementById(options.containerId),
          'default',
        );
      }
    },

    // 当前组件设置信息变更时调用
    onUpdated(props) {
      if (!props.dataset || !props.dataset.columns || !props.config) {
        return;
      }
      if (!this.isMatchRequirement(props.config)) {
        this.chart?.clear();
        return;
      }
      const newOptions = this.getOptions(props.dataset, props.config);
      this.chart?.setOption(Object.assign({}, newOptions), true);
    },

    // 卸载组件清理资源
    onUnMount() {
      this.chart && this.chart.dispose();
    },

    // 改变大小时触发
    onResize(opt, context) {
      this.chart && this.chart.resize(context);
    },

    getOptions(dataset, config) {
      console.log(dataset, config)
      const styleConfigs = config.styles;
      const dataConfigs = config.datas || [];
      const aggregateConfigs = dataConfigs
        .filter(c => c.type === 'aggregate')
        .flatMap(config => config.rows || []);
      const objDataColumns = dHelper.transformToObjectArray(
        dataset.rows,
        dataset.columns,
      );
      let dimensionTitleList = []; // 包含维度栏中所有字段的数组
      dataConfigs[0].rows.forEach(dimensionObj => {
        dimensionTitleList.push(dimensionObj.colName);
      });
      const metricsTitle =
        dataConfigs[1].rows[0].aggregate +
        '(' +
        dataConfigs[1].rows[0].colName +
        ')';
      const relationObj =
        this.createDimensionTitleRelationObj(dimensionTitleList); // 维度字段的树结构
      let dimensionList = []; // 包含所有维度栏字段的数据的数组 e.g. [{province_name: [广东省, 湖南省]}, {city_name: [广州市, 深圳市, 长沙市]}]
      for (let i = 0; i < dimensionTitleList.length; i++) {
        const currDimensionTitle = dimensionTitleList[i];
        const newDimensionObj = {};
        newDimensionObj[currDimensionTitle] = [];
        dimensionList.push(newDimensionObj);
        objDataColumns.forEach(record => {
          if (
            dimensionList[i][currDimensionTitle].indexOf(
              record[currDimensionTitle],
            ) === -1
          ) {
            dimensionList[i][currDimensionTitle].push(
              record[currDimensionTitle],
            );
          }
        });
      }

      let dimensionRelationList = []; // series.data的树结构
      let parentDimension = undefined; // 父节点
      dimensionTitleList.forEach(dimensionTitle => {
        if (
          relationObj.name === dimensionTitle &&
          relationObj.children !== undefined
        )
          parentDimension = dimensionTitle;
      });

      if (relationObj.children) {
        dimensionList.forEach(dimensionObj => {
          const dimensionTitle = Object.keys(dimensionObj)[0];
          if (dimensionTitle === parentDimension) {
            dimensionObj[dimensionTitle].forEach(dimensionData => {
              dimensionRelationList.push({ name: dimensionData, children: [] });
            });
            dimensionRelationList.forEach(root => {
              objDataColumns.forEach(record => {
                if (root.children === []) {
                  if (record[parentDimension] === root.name) {
                    root.children.push(
                      this.createDimensionRelationObj(
                        relationObj.children,
                        record,
                        metricsTitle,
                        objDataColumns,
                        parentDimension,
                      ),
                    );
                  }
                } else {
                  let childrenNameList = [];
                  root.children.forEach(children => {
                    childrenNameList.push(children.name);
                  });
                  if (
                    record[parentDimension] === root.name &&
                    childrenNameList.indexOf(
                      record[relationObj.children.name],
                    ) === -1
                  ) {
                    root.children.push(
                      this.createDimensionRelationObj(
                        relationObj.children,
                        record,
                        metricsTitle,
                        objDataColumns,
                        parentDimension,
                      ),
                    );
                  }
                }
              });
            });
          }
        });
      } else {
        const dimensionTitle = relationObj.name;
        objDataColumns.forEach(record => {
          dimensionRelationList.push({
            name: record[dimensionTitle],
            value: record[metricsTitle],
          });
        });
      }
      dimensionRelationList = {
        name: 'flare',
        children: [
          {
            name: 'data',
            children: [
              {
                name: 'converters',
                children: [
                  { name: 'Converters', value: 721 },
                  { name: 'DelimitedTextConverter', value: 4294 }
                ]
              },
              {
                name: 'DataUtil',
                value: 3322
              }
            ]
          },
          {
            name: 'display',
            children: [
              { name: 'DirtySprite', value: 8833 },
              { name: 'LineSprite', value: 1732 },
              { name: 'RectSprite', value: 3623 }
            ]
          },
          {
            name: 'flex',
            children: [{ name: 'FlareVis', value: 4116 }]
          },
          {
            name: 'query',
            children: [
              { name: 'AggregateExpression', value: 1616 },
              { name: 'And', value: 1027 },
              { name: 'Arithmetic', value: 3891 },
              { name: 'Average', value: 891 },
              { name: 'BinaryExpression', value: 2893 },
              { name: 'Comparison', value: 5103 },
              { name: 'CompositeExpression', value: 3677 },
              { name: 'Count', value: 781 },
              { name: 'DateUtil', value: 4141 },
              { name: 'Distinct', value: 933 },
              { name: 'Expression', value: 5130 },
              { name: 'ExpressionIterator', value: 3617 },
              { name: 'Fn', value: 3240 },
              { name: 'If', value: 2732 },
              { name: 'IsA', value: 2039 },
              { name: 'Literal', value: 1214 },
              { name: 'Match', value: 3748 },
              { name: 'Maximum', value: 843 },
              {
                name: 'methods',
                children: [
                  { name: 'add', value: 593 },
                  { name: 'and', value: 330 },
                  { name: 'average', value: 287 },
                  { name: 'count', value: 277 },
                  { name: 'distinct', value: 292 },
                  { name: 'div', value: 595 },
                  { name: 'eq', value: 594 },
                  { name: 'fn', value: 460 },
                  { name: 'gt', value: 603 },
                  { name: 'gte', value: 625 },
                  { name: 'iff', value: 748 },
                  { name: 'isa', value: 461 },
                  { name: 'lt', value: 597 },
                  { name: 'lte', value: 619 },
                  { name: 'max', value: 283 },
                  { name: 'min', value: 283 },
                  { name: 'mod', value: 591 },
                  { name: 'mul', value: 603 },
                  { name: 'neq', value: 599 },
                  { name: 'not', value: 386 },
                  { name: 'or', value: 323 },
                  { name: 'orderby', value: 307 },
                  { name: 'range', value: 772 },
                  { name: 'select', value: 296 },
                  { name: 'stddev', value: 363 },
                  { name: 'sub', value: 600 },
                  { name: 'sum', value: 280 },
                  { name: 'update', value: 307 },
                  { name: 'variance', value: 335 },
                  { name: 'where', value: 299 },
                  { name: 'xor', value: 354 },
                  { name: 'x_x', value: 264 }
                ]
              },
              { name: 'Minimum', value: 843 },
              { name: 'Not', value: 1554 },
              { name: 'Or', value: 970 },
              { name: 'Query', value: 13896 },
              { name: 'Range', value: 1594 },
              { name: 'StringUtil', value: 4130 },
              { name: 'Sum', value: 791 },
              { name: 'Variable', value: 1124 },
              { name: 'Variance', value: 1876 },
              { name: 'Xor', value: 1101 }
            ]
          },
          {
            name: 'scale',
            children: [
              { name: 'IScaleMap', value: 2105 },
              { name: 'LinearScale', value: 1316 },
              { name: 'LogScale', value: 3151 },
              { name: 'OrdinalScale', value: 3770 },
              { name: 'QuantileScale', value: 2435 },
              { name: 'QuantitativeScale', value: 4839 },
              { name: 'RootScale', value: 1756 },
              { name: 'Scale', value: 4268 },
              { name: 'ScaleType', value: 1821 },
              { name: 'TimeScale', value: 5833 }
            ]
          }
        ]
      };
      let options = {
        series: [{
          type: 'tree',
          data: [dimensionRelationList],
          levels: this.getLevelOption(),
          label: this.getLabelStyle(),
          // breadcrumb: {
          //     show: true,
          //     top: 'bottom',
          // }
          // breadcrumb: this.getBreadCrumbStyle(styleConfigs),
        }],
      };
      return options;
    },

    createDimensionTitleRelationObj(array) {
      if (array.length === 1) {
        return { name: array[0] };
      }
      return {
        name: array[0],
        children: this.createDimensionTitleRelationObj(array.slice(1)),
      };
    },

    createDimensionRelationObj(
      relationObj,
      record,
      metricsTitle,
      objDataColumns,
      parentDimension,
    ) {
      if (!relationObj.children) {
        return { name: record[relationObj.name], value: record[metricsTitle] };
      } else {
        let result = { name: record[relationObj.name], children: [] };
        objDataColumns.forEach(data => {
          if (
            data[relationObj.name] === result.name &&
            data[parentDimension] === record[parentDimension]
          ) {
            result.children.push(
              this.createDimensionRelationObj(
                relationObj.children,
                data,
                metricsTitle,
                objDataColumns,
                parentDimension,
              ),
            );
          }
        });
        return result;
      }
    },

    getLabelStyle() {
      return {
        backgroundColor: '#fff',
        position: 'left',
        verticalAlign: 'middle',
        align: 'right'
      };
    },

    getBreadCrumbStyle(styles) {
      const show = dHelper.getStyleValueByGroup(
        styles,
        'breadcrumb',
        'showBreadCrumb',
      );
      const position = dHelper.getStyleValueByGroup(
        styles,
        'breadcrumb',
        'position',
      );
      return {
        show: show,
        top: position,
      };
    },

    getLevelOption() {
      return {
        label: {
          position: 'right',
          verticalAlign: 'middle',
          align: 'left'
        }
      }
    },
  };
}

export default PolylineTree;
