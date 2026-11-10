<template>
  <div>
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

  // 默认定位到
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    75.0, // 东
    0.0, // 南
    140.0, // 西
    60.0 // 北
  );


  const currentViewer = new Cesium.Viewer('cesiumContainer', {
    // animation: false,       // 关闭底部动画控件
    // timeline: false,        // 关闭底部时间轴控件
    // fullscreenButton: false, // 关闭底部全屏按钮
    // baseLayerPicker: false, // 关闭右上角图层选择器
    // geocoder: false, // 关闭右上角搜索框
    // homeButton: false, // 关闭右上角主页按钮
    // navigationHelpButton: false, // 关闭右上角问号帮助按钮
    // sceneModePicker: false, // 关闭右上角地球场景切换按钮
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
      )
    ),
  });

  viewer.value = currentViewer;
  window.currentViewer = currentViewer; // 将 Cesium Viewer 实例挂载到全局，方便调试
  currentViewer.cesiumWidget.creditContainer.style.display = "none";
  currentViewer.scene.debugShowFramesPerSecond = true; // 展示fps

  // 天空盒
  currentViewer.scene.skyBox = new Cesium.SkyBox({
    sources : {
      positiveX: "/skybox/px.jpg",
      negativeX: "/skybox/nx.jpg",
      positiveY: "/skybox/py.jpg",
      negativeY: "/skybox/ny.jpg",
      positiveZ: "/skybox/nz.jpg",
      negativeZ: "/skybox/pz.jpg",
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


</style>
