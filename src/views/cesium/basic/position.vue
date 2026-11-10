<template>
  <div>
    <div id="cesiumContainer"></div>
    <!-- 悬浮提示框 -->
    <div
      v-show="tooltip.visible"
      :style="tooltipStyle"
      class="cesium-tooltip"
    >
      <div class="tooltip-title">坐标信息</div>
      <div>WGS84 经纬度：{{ tooltip.lon }}, {{ tooltip.lat }}</div>
      <div>屏幕像素 (2D)：{{ tooltip.screenX }}, {{ tooltip.screenY }}</div>
      <div>笛卡尔坐标 (3D)：{{ tooltip.cartesianX }}, {{ tooltip.cartesianY }}, {{ tooltip.cartesianZ }}</div>
      <div v-if="tooltip.height">高度(非海拔高度，而是基于抽象椭球体的高度)：{{ tooltip.height }} m</div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue';
import * as Cesium from 'cesium';

window.Cesium = Cesium; // 将 Cesium 挂载到全局，方便调试

const viewer = shallowRef<Cesium.Viewer | null>(null);

const tooltip = reactive({
  visible: false,
  // 屏幕坐标
  clientX: 0,
  clientY: 0,
  screenX: '',
  screenY: '',
  // WGS84 经纬度
  lon: '',
  lat: '',
  height: '',
  // 笛卡尔 3D 坐标
  cartesianX: '',
  cartesianY: '',
  cartesianZ: '',
});

const tooltipStyle = computed(() => ({
  left: `${tooltip.clientX + 16}px`,
  top: `${tooltip.clientY + 16}px`,
}));

let clickHandler: Cesium.ScreenSpaceEventHandler | null = null;
let moveHandler: Cesium.ScreenSpaceEventHandler | null = null;
const pointEntities: Cesium.Entity[] = [];

onMounted(() => {
  // 默认定位到
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    75.0, // 东
    0.0, // 南
    140.0, // 西
    60.0 // 北
  );

  const currentViewer = new Cesium.Viewer('cesiumContainer', {
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
      )
    ),
  });

  viewer.value = currentViewer;
  window.currentViewer = currentViewer; // 将 Cesium Viewer 实例挂载到全局，方便调试
  currentViewer.cesiumWidget.creditContainer.style.display = 'none';
  currentViewer.scene.debugShowFramesPerSecond = true; // 展示fps

  // 天空盒
  currentViewer.scene.skyBox = new Cesium.SkyBox({
    sources: {
      positiveX: '/skybox/px.jpg',
      negativeX: '/skybox/nx.jpg',
      positiveY: '/skybox/py.jpg',
      negativeY: '/skybox/ny.jpg',
      positiveZ: '/skybox/nz.jpg',
      negativeZ: '/skybox/pz.jpg',
    },
  });

  // ========== 点击添加点标记 ==========
  clickHandler = new Cesium.ScreenSpaceEventHandler(currentViewer.scene.canvas);
  clickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const cartesian = currentViewer.scene.pickPosition(click.position); // 二维坐标
    if (!Cesium.defined(cartesian)) return;

    // 地表拾取失败时 fallback: 用 camera.pickEllipsoid
    const picked = currentViewer.scene.globe.pick(
      currentViewer.scene.camera.getPickRay(click.position) as Cesium.Ray,
      currentViewer.scene,
    );
    const pos = picked ?? cartesian; // 三维坐标
    if (!pos) return;

    const cartographic = Cesium.Cartographic.fromCartesian(pos);
    const lonDeg = Cesium.Math.toDegrees(cartographic.longitude);
    const latDeg = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;

    const entity = currentViewer.entities.add({
      position: pos,
      point: {
        pixelSize: 12,
        color: Cesium.Color.LIME,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        // disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试，使点在所有距离都可见
      },
      // 用 id 存坐标信息，供悬浮 tooltip 读取
      id: `point-${Date.now()}`,
    });

    // 把完整坐标信息挂在 entity 上，悬浮时读取
    (entity as unknown as { _coord?: Record<string, unknown> })._coord = {
      screenX: Math.round(click.position.x).toString(),
      screenY: Math.round(click.position.y).toString(),
      lon: lonDeg.toFixed(6),
      lat: latDeg.toFixed(6),
      height: height.toFixed(2),
      cartesianX: pos.x.toFixed(4),
      cartesianY: pos.y.toFixed(4),
      cartesianZ: pos.z.toFixed(4),
    };

    pointEntities.push(entity);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // ========== 鼠标悬浮显示 tooltip ==========
  moveHandler = new Cesium.ScreenSpaceEventHandler(currentViewer.scene.canvas);
  moveHandler.setInputAction((move: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const picked = currentViewer.scene.pick(move.endPosition);
    if (Cesium.defined(picked) && picked.id && pointEntities.includes(picked.id)) {
      const coord = (picked.id as unknown as { _coord: Record<string, string> })._coord;
      tooltip.visible = true;
      tooltip.clientX = move.endPosition.x;
      tooltip.clientY = move.endPosition.y;
      tooltip.screenX = coord.screenX;
      tooltip.screenY = coord.screenY;
      tooltip.lon = coord.lon;
      tooltip.lat = coord.lat;
      tooltip.height = coord.height;
      tooltip.cartesianX = coord.cartesianX;
      tooltip.cartesianY = coord.cartesianY;
      tooltip.cartesianZ = coord.cartesianZ;
    } else {
      tooltip.visible = false;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
});

onBeforeUnmount(() => {
  clickHandler?.destroy();
  moveHandler?.destroy();
  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy();
  }
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

.cesium-tooltip {
  position: absolute;
  z-index: 9999;
  min-width: 220px;
  padding: 10px 12px;
  border: 1px solid rgb(120 180 255 / 35%);
  border-radius: 6px;
  background: rgb(20 25 35 / 88%);
  box-shadow: 0 4px 14px rgb(0 0 0 / 35%);
  color: #fff;
  font-size: 12px;
  line-height: 1.7;
  white-space: nowrap;
  pointer-events: none;
}

.tooltip-title {
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px dashed rgb(124 200 255 / 30%);
  color: #7cc8ff;
  font-size: 13px;
  font-weight: 600;
}

</style>
