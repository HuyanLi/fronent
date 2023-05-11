/**
 * 自定义扩展极坐标柱状图
 * @param dHelper 构建参数
 * @returns 返回组件
 */

function PolylineTree({ dHelper }) {
  return {
    config: {
      datas: [
        {
          //维度
          label: 'dimension',
          key: 'dimension',
          required: true,
          type: 'group',
          limit: [1, 999],
        },
        // {
        //   label: 'metrics',
        //   key: 'metrics',
        //   required: true,
        //   type: 'aggregate',
        //   limit: [0, 999],
        // },
        {
          //过滤
          label: 'filter',
          key: 'filter',
          type: 'filter',
          allowSameField: true,
        },
      ],
      styles: [
        {
          label: 'polyline.title',
          key: 'polyline',
          comType: 'group',
          rows: [
            {
              label: 'common.borderStyle',
              key: 'borderStyle',
              comType: 'line',
              default: {
                type: 'solid',
                width: 0,
                color: '#ced4da',
              },
            },
            {
              label: 'bar.radius',
              key: 'radius',
              comType: 'inputNumber',
            },
          ],
        },
        {
          label: 'label.title',
          key: 'label',
          comType: 'group',
          rows: [
            {
              label: 'label.showLabel',
              key: 'showLabel',
              default: 12,
              comType: 'checkbox',
            },
          ],
        },

        {
          label: 'itemStyle.title',
          key: 'itemStyle',
          comType: 'group',
          rows: [
            {
              label: 'itemStyle.color',
              key: 'color',
              default: '#1B9AEE',
              comType: 'fontColor',
            },
          ],
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
      ], // TODO
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
            itemStyle: {
              title: '背景',
              color: '背景颜色',
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
            polyline: {
              title: '折线树图',
              radius: '边框圆角',
              color: '柱条颜色',
            },
            bar: {
              title: '条形图',
              enable: '开启横向展示',
              radius: '边框圆角',
              width: '柱条宽度',
              gap: '柱间隙',
              color: '柱条颜色',
            },
            splitLine: {
              title: '分割线',
              showRadiusLine: '显示径向轴分割线',
              showAngleLine: '显示角度轴分割线',
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
    isISOContainer: 'polyline-tree',
    dependency: ['/custom-chart-plugins/temp/echarts_5.0.2.js'],
    meta: {
      id: 'polyline-tree',
      name: '折线树图',
      icon: 'chart',
      requirements: [
        {
          group: 1,
          aggregate: [0, 999],
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
        this._mouseEvents?.forEach(event => {
          // 图表点击事件
          let clickFunc = params => {
            if (event.callback) {
              event.callback(params);
            }
          };
          this.chart.on(event.name, clickFunc);
        });
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
      console.log(dataset, config, 'dataset');
      const styleConfigs = config.styles;
      const dataConfigs = config.datas || [];
      const aggregateConfigs = dataConfigs
        .filter(c => c.type === 'aggregate')
        .flatMap(config => config.rows || []);
      const objDataColumns = dHelper.transformToObjectArray(
        dataset.rows,
        dataset.columns,
      );
      let dimensionRelationList = this.toTree(dataset.rows);
      // let dimensionTitleList = []; // 包含维度栏中所有字段的数组
      // dataConfigs[0].rows.forEach(dimensionObj => {
      //   dimensionTitleList.push(dimensionObj.colName);
      // });
      // const relationObj =
      //   this.createDimensionTitleRelationObj(dimensionTitleList); // 维度字段的树结构
      // let dimensionList = []; // 包含所有维度栏字段的数据的数组
      // for (let i = 0; i < dimensionTitleList.length; i++) {
      //   const currDimensionTitle = dimensionTitleList[i];
      //   const newDimensionObj = {};
      //   newDimensionObj[currDimensionTitle] = [];
      //   dimensionList.push(newDimensionObj);
      //   objDataColumns.forEach(record => {
      //     if (
      //       dimensionList[i][currDimensionTitle].indexOf(
      //         record[currDimensionTitle],
      //       ) === -1
      //     ) {
      //       dimensionList[i][currDimensionTitle].push(
      //         record[currDimensionTitle],
      //       );
      //     }
      //   });
      // }

      // let dimensionRelationList = []; // series.data的树结构
      // let parentDimension = undefined; // 父节点
      // dimensionTitleList.forEach(dimensionTitle => {
      //   if (
      //     relationObj.name === dimensionTitle &&
      //     relationObj.children !== undefined
      //   )
      //     parentDimension = dimensionTitle;
      // });
      // if (relationObj.children) {
      //   dimensionList.forEach(dimensionObj => {
      //     const dimensionTitle = Object.keys(dimensionObj)[0];
      //     if (dimensionTitle === parentDimension) {
      //       dimensionObj[dimensionTitle].forEach(dimensionData => {
      //         dimensionRelationList.push({ name: dimensionData, children: [] });
      //       });
      //       dimensionRelationList.forEach(root => {
      //         objDataColumns.forEach(record => {
      //           if (root.children === []) {
      //             if (record[parentDimension] === root.name) {
      //               root.children.push(
      //                 this.createDimensionRelationObj(
      //                   relationObj.children,
      //                   record,
      //                   objDataColumns,
      //                   parentDimension,
      //                 ),
      //               );
      //             }
      //           } else {
      //             let childrenNameList = [];
      //             root.children.forEach(children => {
      //               childrenNameList.push(children.name);
      //             });
      //             if (
      //               record[parentDimension] === root.name &&
      //               childrenNameList.indexOf(
      //                 record[relationObj.children.name],
      //               ) === -1
      //             ) {
      //               root.children.push(
      //                 this.createDimensionRelationObj(
      //                   relationObj.children,
      //                   record,
      //                   objDataColumns,
      //                   parentDimension,
      //                 ),
      //               );
      //             }
      //           }
      //         });
      //       });
      //     }
      //   });
      // } else {
      //   const dimensionTitle = relationObj.name;
      //   objDataColumns.forEach(record => {
      //     dimensionRelationList.push({
      //       name: record[dimensionTitle],
      //     });
      //   });
      // }
      // console.log(dimensionRelationList, 'dimensionRelationList');
      // const result = [];
      // dimensionRelationList.forEach(child => this.merge(result, child));
      const bgColor = dHelper.getStyleValueByGroup(
        styleConfigs,
        'itemStyle',
        'color',
      );
      const borderStyle = dHelper.getStyleValueByGroup(
        styleConfigs,
        'itemStyle',
        'color',
      );
      let options = {
        series: [
          {
            type: 'tree',
            name: 'tree1',
            data: dimensionRelationList,
            top: '10%',
            left: '8%',
            bottom: '8%',
            right: '10%',
            nodePadding: 80, //节点间距
            layerPadding: 80, //层间距
            symbol: 'rect', // 长方形
            symbolSize: [150, 40], // 长方形的宽、高
            edgeShape: 'polyline',
            edgeForkPosition: '63%',
            initialTreeDepth: 3,
            orient: 'horizontal',
            lineStyle: {
              width: 2,
            },
            itemStyle: {
              color: bgColor,
              // borderColor: '#333',
            },
            label: this.getLabelStyle(styleConfigs),
            emphasis: {
              focus: 'descendant',
            },
            expandAndCollapse: true,
            animationDuration: 550,
            animationDurationUpdate: 750,
          },
        ],
      };
      return options;
    },

    merge(source, child) {
      const curItem = source.find(item => item.name === child.name);
      if (!curItem) {
        source.push(child);
      } else {
        if (curItem.children && child.children) {
          child.children.forEach(childData =>
            this.merge(curItem.children, childData),
          );
        }
      }
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
    toTree(arr) {
      const obj = {};
      const res = [];
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
          const item = arr[i][j];
          if (item && !obj[item]) {
            console.log(item);
            obj[item] = {
              name: item,
              children: [],
            };
          }
          if (j > 0) {
            const parent = obj[arr[i][j - 1]];
            if (parent && obj[item]) {
              if (parent.children.indexOf(obj[item]) < 0) {
                console.log(obj[item], 'toTree');
                parent.children.push(obj[item]);
              }
            }
          } else {
            if (res.indexOf(obj[item]) < 0) {
              res.push(obj[item]);
            }
          }
        }
      }
      return res;
    },
    createDimensionRelationObj(
      relationObj,
      record,
      objDataColumns,
      parentDimension,
    ) {
      if (!relationObj.children) {
        return { name: record[relationObj.name], value: record };
      } else {
        let result = { name: record[relationObj.name], children: [] };
        objDataColumns.forEach(data => {
          if (data[relationObj.children.name] !== null) {
            if (
              data[relationObj.name] === result.name &&
              data[parentDimension] === record[parentDimension]
            ) {
              result.children.push(
                this.createDimensionRelationObj(
                  relationObj.children,
                  data,
                  objDataColumns,
                  parentDimension,
                ),
              );
            }
          }
        });
        return result;
      }
    },
    getLabelStyle(styles) {
      const show = dHelper.getStyleValueByGroup(styles, 'label', 'showLabel');
      const position = dHelper.getStyleValueByGroup(
        styles,
        'label',
        'position',
      );
      const font = dHelper.getStyleValueByGroup(styles, 'label', 'font');
      return { show, position, ...font };
    },
  };
}

export default PolylineTree;
