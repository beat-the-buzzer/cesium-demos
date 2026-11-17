<template>
  <div class="camera-demo">
    <div id="cesiumContainer"></div>

    <!-- 左侧控制面板 -->
    <div class="control-panel">
      <h3 class="panel-title">📷 相机系统 Demo</h3>

      <!-- 相机状态 -->
      <div class="section">
        <div class="section-title">实时状态</div>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">经度</span>
            <span class="value">{{ cameraState.lng.toFixed(4) }}°</span>
          </div>
          <div class="status-item">
            <span class="label">纬度</span>
            <span class="value">{{ cameraState.lat.toFixed(4) }}°</span>
          </div>
          <div class="status-item">
            <span class="label">高度</span>
            <span class="value">{{ (cameraState.height / 1000).toFixed(2) }} km</span>
          </div>
          <div class="status-item">
            <span class="label">Heading</span>
            <span class="value">{{ cameraState.heading.toFixed(1) }}°</span>
          </div>
          <div class="status-item">
            <span class="label">Pitch</span>
            <span class="value">{{ cameraState.pitch.toFixed(1) }}°</span>
          </div>
          <div class="status-item">
            <span class="label">Roll</span>
            <span class="value">{{ cameraState.roll.toFixed(1) }}°</span>
          </div>
        </div>
      </div>

      <!-- setView 直接设置 -->
      <div class="section">
        <div class="section-title">setView — 直接设置视角</div>
        <p class="section-desc">瞬间跳转到指定位置和姿态，无过渡动画</p>
        <div class="btn-group">
          <button class="btn" @click="setViewBeijing">北京 俯视</button>
          <button class="btn" @click="setViewShanghai">上海 斜视</button>
          <button class="btn" @click="setViewGlobal">全球 俯视</button>
        </div>
      </div>

      <!-- viewBoundingSphere 包围球 -->
      <div class="section">
        <div class="section-title">viewBoundingSphere — 按范围取景</div>
        <p class="section-desc">自动调整相机让目标范围全部入镜</p>
        <div class="btn-group">
          <button class="btn" @click="viewBoundingEurope">欧洲范围</button>
          <button class="btn" @click="viewBoundingUS">美国范围</button>
          <button class="btn" @click="viewBoundingChina">中国范围</button>
        </div>
      </div>

      <!-- flyTo 飞行 -->
      <div class="section">
        <div class="section-title">flyTo — 平滑飞行</div>
        <p class="section-desc">沿弧线飞抵目标，可指定飞行时长</p>
        <div class="btn-group">
          <button class="btn btn-primary" @click="flyToEiffel">飞 埃菲尔铁塔</button>
          <button class="btn btn-primary" @click="flyToPyramid">飞 金字塔</button>
          <button class="btn btn-primary" @click="flyToGrandCanyon">飞 大峡谷</button>
          <button class="btn btn-primary" @click="flyToCityList">依次飞越城市</button>
        </div>
      </div>

      <!-- lookAt 锁定目标 -->
      <div class="section">
        <div class="section-title">lookAt — 锁定观察目标</div>
        <p class="section-desc">相机始终朝向目标点，heading/pitch/roll 控制观察角度</p>
        <div class="btn-group">
          <button class="btn btn-warn" @click="lookAtForbiddenCity">锁定 故宫</button>
          <button class="btn btn-warn" @click="lookAtMountain">锁定 珠峰</button>
          <button class="btn btn-warn" @click="lookAtOcean">锁定 马里亚纳海沟</button>
        </div>
      </div>

      <!-- 重置 -->
      <div class="section">
        <button class="btn btn-reset" @click="resetView">🔄 重置默认视角</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import * as Cesium from 'cesium';

// 扩展全局 window 类型，方便调试
declare global {
  interface Window {
    Cesium: typeof Cesium;
    currentViewer: Cesium.Viewer;
  }
}

window.Cesium = Cesium;

const viewer = shallowRef<Cesium.Viewer | null>(null);
let cameraListener: (() => void) | null = null;
let flyTimeout: number | null = null;

// 相机状态（实时更新）
const cameraState = reactive({
  lng: 0,
  lat: 0,
  height: 0,
  heading: 0,
  pitch: 0,
  roll: 0,
});

// 城市/兴趣点数据
const cities = [
  { name: '北京', lng: 116.4074, lat: 39.9042, height: 150000 },
  { name: '上海', lng: 121.4737, lat: 31.2304, height: 120000 },
  { name: '广州', lng: 113.2644, lat: 23.1291, height: 100000 },
  { name: '成都', lng: 104.0668, lat: 30.5728, height: 110000 },
  { name: '西安', lng: 108.9398, lat: 34.3416, height: 130000 },
];

// =========== 初始化 ===========
onMounted(() => {
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(75.0, 0.0, 140.0, 60.0);

  const currentViewer = new Cesium.Viewer('cesiumContainer', {
    // baseLayerPicker: false,
    // baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    //   Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'))
    // ),
  });

  viewer.value = currentViewer;
  window.currentViewer = currentViewer;
  (currentViewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
  currentViewer.scene.debugShowFramesPerSecond = false;

  // 添加一些城市标注点，方便 lookAt / flyTo 演示
  addCityMarkers(currentViewer);

  // 监听相机变化，实时更新状态
  cameraListener = currentViewer.camera.changed.addEventListener(() => {
    updateCameraState(currentViewer);
  });
  updateCameraState(currentViewer);
});

onBeforeUnmount(() => {
  if (flyTimeout) clearTimeout(flyTimeout);
  if (cameraListener) cameraListener();
  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy();
  }
});

// =========== 工具函数 ===========
function getViewer(): Cesium.Viewer {
  if (!viewer.value) throw new Error('Viewer 尚未初始化');
  return viewer.value;
}

/** 更新相机状态面板 */
function updateCameraState(v: Cesium.Viewer) {
  const camera = v.camera;
  const carto = Cesium.Cartographic.fromCartesian(camera.position);
  cameraState.lng = Cesium.Math.toDegrees(carto.longitude);
  cameraState.lat = Cesium.Math.toDegrees(carto.latitude);
  cameraState.height = carto.height;
  cameraState.heading = Cesium.Math.toDegrees(camera.heading);
  cameraState.pitch = Cesium.Math.toDegrees(camera.pitch);
  cameraState.roll = Cesium.Math.toDegrees(camera.roll);
}

/** 在地图上绘制城市标注 */
function addCityMarkers(v: Cesium.Viewer) {
  cities.forEach((c) => {
    v.entities.add({
      name: c.name,
      position: Cesium.Cartesian3.fromDegrees(c.lng, c.lat),
      point: { pixelSize: 8, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
      label: {
        text: c.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -16),
      },
    });
  });

  // 特殊地标
  v.entities.add({
    name: '故宫',
    position: Cesium.Cartesian3.fromDegrees(116.3974, 39.9163),
    point: { pixelSize: 12, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
    label: {
      text: '🏯 故宫',
      font: '15px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -20),
    },
  });
}

// =========== setView — 直接设置视角 ===========
/**
 * setView 是"瞬移"，不带动画。
 * 可以使用 destination + orientation，或者 direction + up。
 */
function setViewBeijing() {
  const v = getViewer();
  v.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 50000),
    orientation: {
      heading: Cesium.Math.toRadians(0),   // 朝北
      pitch: Cesium.Math.toRadians(-45),    // 俯视 45°
      roll: 0,
    },
  });
}

function setViewShanghai() {
  const v = getViewer();
  v.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 80000),
    orientation: {
      heading: Cesium.Math.toRadians(90),   // 朝东
      pitch: Cesium.Math.toRadians(-30),    // 斜视 30°
      roll: Cesium.Math.toRadians(10),      // 轻微倾斜
    },
  });
}

function setViewGlobal() {
  const v = getViewer();
  v.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 20000000), // 很高的高度，看到整个地球
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),    // 完全俯视
      roll: 0,
    },
  });
}

// =========== viewBoundingSphere — 按范围取景 ===========
/**
 * 根据目标 BoundingSphere 自动计算相机位置，让目标完整入镜。
 * 适合"飞到某个数据范围"的场景。
 */
function viewBoundingChina() {
  const v = getViewer();
  // 中国大致的经纬度范围矩形
  const rectangle = Cesium.Rectangle.fromDegrees(73.5, 18.0, 135.0, 53.5);
  const bs = Cesium.BoundingSphere.fromRectangle3D(rectangle);
  v.camera.viewBoundingSphere(bs, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 0));
}

function viewBoundingEurope() {
  const v = getViewer();
  const rectangle = Cesium.Rectangle.fromDegrees(-10.0, 35.0, 40.0, 70.0);
  const bs = Cesium.BoundingSphere.fromRectangle3D(rectangle);
  v.camera.viewBoundingSphere(bs, new Cesium.HeadingPitchRange(Cesium.Math.toRadians(45), Cesium.Math.toRadians(-25), 0));
}

function viewBoundingUS() {
  const v = getViewer();
  const rectangle = Cesium.Rectangle.fromDegrees(-125.0, 24.0, -66.0, 50.0);
  const bs = Cesium.BoundingSphere.fromRectangle3D(rectangle);
  v.camera.viewBoundingSphere(bs, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-35), 0));
}

// =========== flyTo — 平滑飞行 ===========
/**
 * flyTo 会创建一条弧线轨迹飞往目标。
 * 可以指定 duration（秒）、maximumHeight（最高点）等。
 */
function flyToEiffel() {
  const v = getViewer();
  v.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(2.2945, 48.8584, 300),
    orientation: {
      heading: Cesium.Math.toRadians(135),
      pitch: Cesium.Math.toRadians(-20),
      roll: 0,
    },
    duration: 3,
    complete: () => console.log('✈️ 已飞抵埃菲尔铁塔'),
  });
}

function flyToPyramid() {
  const v = getViewer();
  v.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(31.1342, 29.9792, 500),
    orientation: {
      heading: Cesium.Math.toRadians(45),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0,
    },
    duration: 2.5,
  });
}

function flyToGrandCanyon() {
  const v = getViewer();
  v.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-112.1129, 36.1069, 2000),
    orientation: {
      heading: Cesium.Math.toRadians(-90),
      pitch: Cesium.Math.toRadians(-40),
      roll: 0,
    },
    duration: 4,
    maximumHeight: 1500000, // 飞行弧线最高点（米），越高弧线越明显
  });
}

/** 依次飞越所有城市 */
function flyToCityList() {
  if (flyTimeout) clearTimeout(flyTimeout);
  const v = getViewer();
  let idx = 0;

  const flyNext = () => {
    if (idx >= cities.length) return;
    const c = cities[idx];
    v.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(c.lng, c.lat, c.height),
      orientation: {
        heading: Cesium.Math.toRadians(Math.random() * 360),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 1.8,
      complete: () => {
        idx++;
        flyTimeout = window.setTimeout(flyNext, 600);
      },
    });
  };
  flyNext();
}

// =========== lookAt — 锁定观察目标 ===========
/**
 * lookAt 把相机"锁"在某个目标点上。
 * 之后无论 heading/pitch/roll 如何变化，相机始终看向该目标。
 * 内部通过设置 camera.position + direction + up 实现。
 */
function lookAtForbiddenCity() {
  const v = getViewer();
  const target = Cesium.Cartesian3.fromDegrees(116.3974, 39.9163, 0);
  v.camera.lookAt(
    target,
    new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(45),    // heading：从目标的哪个方向看
      Cesium.Math.toRadians(-20),   // pitch：俯角（-90 为正俯视）
      3000                          // range：距目标多远
    )
  );
}

function lookAtMountain() {
  const v = getViewer();
  // 珠峰：86.9250°E, 27.9881°N, 8848m
  const target = Cesium.Cartesian3.fromDegrees(86.9250, 27.9881, 8848);
  v.camera.lookAt(
    target,
    new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(-30),
      Cesium.Math.toRadians(-15),
      10000
    )
  );
}

function lookAtOcean() {
  const v = getViewer();
  // 马里亚纳海沟：142.2°E, 11.3°N, -10984m
  const target = Cesium.Cartesian3.fromDegrees(142.2, 11.3, -10984);
  v.camera.lookAt(
    target,
    new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 8000)
  );
}

// =========== 重置 ===========
function resetView() {
  const v = getViewer();
  if (flyTimeout) clearTimeout(flyTimeout);
  v.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 20000000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
  });
}
</script>

<style scoped>
.camera-demo {
  position: relative;
  width: 100%;
  height: 100%;
}

#cesiumContainer {
  width: 100%;
  height: calc(100vh - 80px);
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 控制面板 */
.control-panel {
  position: absolute;
  z-index: 10;
  top: 12px;
  left: 12px;
  width: 320px;
  max-height: calc(100vh - 100px);
  padding: 14px 16px;
  overflow-y: auto;
  border: 1px solid rgb(120 160 220 / 25%);
  border-radius: 10px;
  background: rgb(20 24 35 / 92%);
  box-shadow: 0 4px 20px rgb(0 0 0 / 40%);
  color: #e8edf5;
  font-size: 13px;
  backdrop-filter: blur(8px);
  scrollbar-width: thin;
  scrollbar-color: rgb(120 160 220 / 40%) transparent;
}

.control-panel::-webkit-scrollbar { width: 6px; }

.control-panel::-webkit-scrollbar-thumb { border-radius: 3px; background: rgb(120 160 220 / 40%); }

.panel-title {
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgb(127 180 255 / 25%);
  color: #7fb4ff;
  font-size: 15px;
  font-weight: 600;
}

.section {
  margin-bottom: 14px;
}

.section-title {
  margin-bottom: 4px;
  color: #9ec8ff;
  font-size: 13px;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 6px;
  color: #89a;
  font-size: 11px;
  line-height: 1.5;
}

/* 状态显示 */
.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgb(255 255 255 / 4%);
  gap: 4px 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
}

.status-item .label { color: #89a; }

.status-item .value { color: #ffd666; font-weight: 500; }

/* 按钮 */
.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn {
  flex: 1 1 calc(50% - 6px);
  min-width: 120px;
  padding: 7px 10px;
  transition: all 0.2s;
  border: 1px solid rgb(120 160 220 / 40%);
  border-radius: 6px;
  background: rgb(80 120 180 / 25%);
  color: #e8edf5;
  font-size: 12px;
  cursor: pointer;
}

.btn:hover {
  transform: translateY(-1px);
  border-color: rgb(150 200 255 / 70%);
  background: rgb(100 150 220 / 45%);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  border-color: rgb(80 160 255 / 55%);
  background: rgb(40 120 220 / 35%);
}

.btn-primary:hover {
  background: rgb(60 150 255 / 55%);
}

.btn-warn {
  border-color: rgb(255 170 80 / 50%);
  background: rgb(220 130 40 / 30%);
}

.btn-warn:hover {
  background: rgb(255 160 60 / 50%);
}

.btn-reset {
  width: 100%;
  border-color: rgb(255 100 100 / 50%);
  background: rgb(220 60 60 / 30%);
  font-weight: 600;
}

.btn-reset:hover {
  background: rgb(255 80 80 / 50%);
}
</style>
