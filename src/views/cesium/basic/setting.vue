<template>
  <div>
    <div class="custom-controls" v-if="false">
      <div class="cesium-button custom-btn" title="飞到示例点">
        飞到示例点(默认高度)
      </div>
      <div class="cesium-button custom-btn" title="飞到指定坐标和高度">
        飞到指定坐标和高度(1500000米)
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

const viewer = shallowRef<Cesium.Viewer | null>(null);

onMounted(() => {
  // console.log(Cesium)
  // Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN_HERE';

  const currentViewer = new Cesium.Viewer('cesiumContainer', {
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
  currentViewer.cesiumWidget.creditContainer.style.display = "none";
  currentViewer.scene.debugShowFramesPerSecond = true; // 展示fps

  // 天空盒
  currentViewer.scene.skyBox = new Cesium.SkyBox({
    sources : {
      positiveX: "/skybox/00h+00.jpg",
      negativeX: "/skybox/12h+00.jpg",
      positiveY: "/skybox/06h+00.jpg",
      negativeY: "/skybox/18h+00.jpg",
      positiveZ: "/skybox/06h+90.jpg",
      negativeZ: "/skybox/06h-90.jpg",
    },
  });
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
