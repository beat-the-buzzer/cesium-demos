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

  const currentViewer = new Cesium.Viewer('cesiumContainer', {
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
      )
    ),
  });

  viewer.value = currentViewer;
  window.viewer = currentViewer; // 将 Cesium Viewer 实例挂载到全局，方便调试
  currentViewer.scene.debugShowFramesPerSecond = true; // 展示fps
  // (currentViewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none"; // 底部logo 版权等信息隐藏
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
