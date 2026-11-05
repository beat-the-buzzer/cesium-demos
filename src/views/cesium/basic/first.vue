<template>
  <div>
    <div class="custom-controls" v-if="false">
      <div class="cesium-button custom-btn" title="飞到示例点" @click="flyToExamplePoint">
        飞到示例点(默认高度)
      </div>
      <div class="cesium-button custom-btn" title="飞到指定坐标和高度" @click="flyToSpecifiedPosition">
        飞到指定坐标和高度(1500000米)
      </div>
      <div class="cesium-button custom-btn" title="瞬间跳转到指定坐标和高度" @click="jumpToSpecifiedPosition">
        瞬间跳转到指定坐标和高度(1000米)
      </div>
    </div>
    <div id="cesiumContainer"></div>
  </div>
</template>

<script setup lang="ts">

import { onMounted, shallowRef } from 'vue';
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';

window.Cesium = Cesium; // 将 Cesium 挂载到全局，方便调试

let myPoint: Cesium.Entity | undefined;
const viewer = shallowRef<Cesium.Viewer | null>(null);

// 飞向该实体位置
function flyToExamplePoint() {
  if (!viewer.value || !myPoint) return;

  viewer.value.flyTo(myPoint, {
    offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 2000)
  });
}

// 飞向指定坐标和高度
function flyToSpecifiedPosition() {
  viewer.value?.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1500000), // 精度 纬度 高度
    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT, // 缓动函数
    duration: 3, // 飞行时间（秒），默认自动计算
    complete: function () {
      // 飞行完成后的回调函数
      console.log('飞行完成');
    },
    cancel: function () {
      // 飞行被取消后的回调函数
      console.log('飞行被取消');
    }
  });
}

// 瞬间跳转到指定坐标和高度
function jumpToSpecifiedPosition() {
  viewer.value?.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000), // 精度 纬度 高度
    orientation: {
      heading: Cesium.Math.toRadians(0),   // 正北方向
      pitch: Cesium.Math.toRadians(-45),   // 俯视 45 度
      roll: 0                              // 不翻滚
    }
  });
}

onMounted(() => {
  // console.log(Cesium)
  // Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN_HERE';

  const currentViewer = new Cesium.Viewer('cesiumContainer', {
    // baseLayerPicker: false,
    // baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    //   Cesium.TileMapServiceImageryProvider.fromUrl(
    //     Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    //   )
    // ),

    // TS报错
    // baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    //   new Cesium.TileCoordinatesImageryProvider()
    // ),

    // TS报错
    // baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    //   new Cesium.OpenStreetMapImageryProvider({
    //     url: "https://a.tile.openstreetmap.org/",
    //   }),
    // )

    // terrain: Cesium.Terrain.fromWorldTerrain(), // 使用全球地形
    // baseLayer: Cesium.ImageryLayer.fromWorldImagery({}), // 使用全球影像
    // animation: false,       // 关闭底部动画控件
    // timeline: false,        // 关闭底部时间轴控件
    // fullscreenButton: false, // 关闭底部全屏按钮
    // baseLayerPicker: false, // 关闭右上角图层选择器
    // geocoder: false, // 关闭右上角搜索框
    // homeButton: false, // 关闭右上角主页按钮
    // navigationHelpButton: false, // 关闭右上角问号帮助按钮
    // sceneModePicker: false, // 关闭右上角地球场景切换按钮
  });

  viewer.value = currentViewer;
  window.viewer = currentViewer; // 将 Cesium Viewer 实例挂载到全局，方便调试
  // currentViewer.scene.debugShowFramesPerSecond = true; // 展示fps
  // (currentViewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none"; // 底部logo 版权等信息隐藏

  return

  // 添加一个实体（详见中文版 API：Entity、Cartesian3、Color）
  myPoint = currentViewer.entities.add({
    name: '示例点(北京)',
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100),
    point: { pixelSize: 12, color: Cesium.Color.RED },
    label: { text: '北京', font: '16pt sans-serif', pixelOffset: new Cesium.Cartesian2(0, -24) }
  });

  const tleLine1 = '1 26400U 00037A   26305.78918650  .00005925  00000-0  11503-3 0  9996';
  const tleLine2 = '2 26400  51.6332 339.1679 0007095 336.8847  23.1822 15.49143202586516';
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
  const orbitPeriodSeconds = (2 * Math.PI / satrec.no) * 60;
  const startDate = new Date();
  startDate.setSeconds(0, 0);
  const start = Cesium.JulianDate.fromDate(startDate);
  const startGmst = satellite.gstime(startDate);
  const stepSeconds = 60;
  const position = new Cesium.SampledPositionProperty();
  const ecefPositions: Cesium.Cartesian3[] = [];
  const eciPositions: Cesium.Cartesian3[] = [];

  for (let i = 0; i <= Math.ceil(orbitPeriodSeconds / stepSeconds); i += 1) {
    const elapsed = Math.min(i * stepSeconds, orbitPeriodSeconds);
    const julianDate = Cesium.JulianDate.addSeconds(start, elapsed, new Cesium.JulianDate());
    const date = Cesium.JulianDate.toDate(julianDate);
    const propagated = satellite.propagate(satrec, date);
    if (!propagated.position) continue;
    const gmst = satellite.gstime(date);
    const ecf = satellite.eciToEcf(propagated.position, gmst);
    const cartesian = new Cesium.Cartesian3(ecf.x * 1000, ecf.y * 1000, ecf.z * 1000);
    position.addSample(julianDate, cartesian);
    // 轨道线和卫星位置统一使用 ECEF 坐标，保证卫星沿轨道线运动。
    ecefPositions.push(cartesian);
    // Cesium 使用地固坐标。将整条 ECI 轨道按起始时刻的 GMST 映射到 Cesium 坐标系，
    // 这样显示的是固定参考时刻下的惯性轨道平面，而不是把 ECI 数值误当成 ECEF。
    const eciAtStart = satellite.eciToEcf(propagated.position, startGmst);
    eciPositions.push(new Cesium.Cartesian3(
      eciAtStart.x * 1000,
      eciAtStart.y * 1000,
      eciAtStart.z * 1000,
    ));
  }

  const stop = Cesium.JulianDate.addSeconds(start, orbitPeriodSeconds, new Cesium.JulianDate());

  currentViewer.clock.startTime = start.clone();
  currentViewer.clock.stopTime = stop.clone();
  currentViewer.clock.currentTime = start.clone();
  currentViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  currentViewer.clock.multiplier = 10;
  currentViewer.clock.shouldAnimate = true;
  currentViewer.timeline.zoomTo(start, stop);

  if (ecefPositions.length > 1) {
    currentViewer.entities.add({
      name: 'NORAD 26400 TLE 地固系轨道（ECEF）',
      polyline: { positions: ecefPositions, width: 2, material: Cesium.Color.CYAN },
    });
  }
  if (eciPositions.length > 1) {
    currentViewer.entities.add({
      name: 'NORAD 26400 TLE 惯性系轨道（ECI，起始时刻映射）',
      polyline: { positions: eciPositions, width: 2, material: Cesium.Color.ORANGE },
    });
  }

  // 创建卫星及其轨迹
  currentViewer.entities.add({
    name: "NORAD 26400",
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start, stop }),
    ]),
    position,

    point: {
      pixelSize: 10,
      color: Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 1,
    },
    label: { text: 'NORAD 26400', font: '12pt sans-serif', pixelOffset: new Cesium.Cartesian2(0, -24) },
  });

  // currentViewer.zoomTo(currentViewer.entities);

  // czml point
  const czml = [
    {
      id: "document",
      name: "CZML Position Definitions",
      version: "1.0",
    },
    {
      id: "point1",
      name: "point in cartographic degrees",
      position: {
        cartographicDegrees: [-111.0, 40.0, 150000.0],
      },
      point: {
        color: {
          rgba: [100, 0, 200, 255],
        },
        outlineColor: {
          rgba: [200, 0, 200, 255],
        },
        pixelSize: {
          number: 10,
        },
      },
      label: {
        fillColor: {
          rgba: [255, 255, 255, 255],
        },
        font: "13pt Lucida Console",
        horizontalOrigin: "LEFT",
        outlineColor: {
          rgba: [150, 0, 150, 255],
        },
        outlineWidth: 3,
        pixelOffset: {
          cartesian2: [20, 0],
        },
        style: "FILL_AND_OUTLINE",
        text: "测试点1",
      },

    },
    {
      id: "point2",
      name: "point in cartesian coordinates",
      position: {
        cartesian: [1216469.9357990976, -4736121.71856379, 4081386.8856866374],
      },
      point: {
        color: {
          rgba: [0, 100, 200, 255],
        },
        outlineColor: {
          rgba: [200, 0, 200, 255],
        },
        pixelSize: {
          number: 10,
        },
      },
      label: {
        fillColor: {
          rgba: [255, 255, 255, 255],
        },
        font: "13pt Lucida Console",
        horizontalOrigin: "LEFT",
        outlineColor: {
          rgba: [150, 0, 150, 255],
        },
        outlineWidth: 3,
        pixelOffset: {
          cartesian2: [20, 0],
        },
        style: "FILL_AND_OUTLINE",
        text: "测试点2",
      },

    },
    {
      id: "point 3",
      name: "point in cartographic radians",
      position: {
        cartographicRadians: [Math.PI, (3 * Math.PI) / 4, 150000],
      },
      point: {
        color: {
          rgba: [10, 200, 10, 255],
        },
        outlineColor: {
          rgba: [200, 0, 200, 255],
        },
        pixelSize: {
          number: 10,
        },
      },
      label: {
        fillColor: {
          rgba: [255, 255, 255, 255],
        },
        font: "13pt Lucida Console",
        horizontalOrigin: "LEFT",
        outlineColor: {
          rgba: [150, 0, 150, 255],
        },
        outlineWidth: 3,
        pixelOffset: {
          cartesian2: [20, 0],
        },
        style: "FILL_AND_OUTLINE",
        text: "测试点3",
      },
    },
  ];

  currentViewer.dataSources.add(Cesium.CzmlDataSource.load(czml));

  currentViewer.dataSources.add(
    Cesium.CzmlDataSource.load("/simple.czml"),
  );

  currentViewer.camera.flyHome(0);
  // 从TLE文件生成卫星轨道数据 
});



</script>



<style scoped>
#cesiumContainer {
  width: 100%;
  height: calc(100vh - 80px);
  margin: 0;
  padding: 0;
  overflow: hidden;
}


/* 自定义控制栏样式 */
.custom-controls {
  display: flex;
  position: absolute;
  z-index: 100;
  top: 20px;
  left: 20px;
  gap: 10px;
}

/* 确保按钮继承 Cesium 风格并增加一些自定义效果 */
.custom-btn {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  transition: all 0.3s ease;
  font-size: 14px;
  gap: 5px;
}

.custom-btn:hover {
  transform: translateY(-2px);
  background-color: rgb(30 30 30 / 80%);
}
</style>
