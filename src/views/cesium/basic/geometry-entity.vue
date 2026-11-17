<template>
  <div class="geometry-demo">
    <div id="cesiumContainer"></div>

    <!-- 左侧控制面板 -->
    <div class="control-panel">
      <h3 class="panel-title">几何形体 Demo</h3>

      <div class="toolbar">
        <button class="btn btn-action" @click="addAll">全部加载</button>
        <button class="btn btn-action" @click="clearAll">清除全部</button>
        <button class="btn btn-action" @click="resetView">重置视角</button>
      </div>

      <!-- 点要素 -->
      <div class="section">
        <div class="section-title">
          <span class="dot dot-point"></span>点要素
        </div>
        <p class="section-desc">point / label / billboard</p>
        <div class="btn-group">
          <button class="btn" :class="{ active: isActive('point-basic') }" @click="toggle('point-basic')">
            基础点
          </button>
          <button class="btn" :class="{ active: isActive('point-label') }" @click="toggle('point-label')">
            点 + 标签
          </button>
          <button class="btn" :class="{ active: isActive('point-billboard') }" @click="toggle('point-billboard')">
            图标（Billboard）
          </button>
        </div>
      </div>

      <!-- 线要素 -->
      <div class="section">
        <div class="section-title">
          <span class="dot dot-line"></span>线要素
        </div>
        <p class="section-desc">polyline / 虚线 / 箭头 / 贴地</p>
        <div class="btn-group">
          <button class="btn" :class="{ active: isActive('line-basic') }" @click="toggle('line-basic')">
            基础线
          </button>
          <button class="btn" :class="{ active: isActive('line-dash') }" @click="toggle('line-dash')">
            虚线
          </button>
          <button class="btn" :class="{ active: isActive('line-arrow') }" @click="toggle('line-arrow')">
            箭头线
          </button>
          <button class="btn" :class="{ active: isActive('line-clamp') }" @click="toggle('line-clamp')">
            贴地线
          </button>
        </div>
      </div>

      <!-- 面要素 -->
      <div class="section">
        <div class="section-title">
          <span class="dot dot-polygon"></span>面要素
        </div>
        <p class="section-desc">polygon / rectangle / ellipse</p>
        <div class="btn-group">
          <button class="btn" :class="{ active: isActive('polygon-basic') }" @click="toggle('polygon-basic')">
            多边形
          </button>
          <button class="btn" :class="{ active: isActive('polygon-outline') }" @click="toggle('polygon-outline')">
            描边多边形
          </button>
          <button class="btn" :class="{ active: isActive('polygon-clamp') }" @click="toggle('polygon-clamp')">
            贴地多边形
          </button>
          <button class="btn" :class="{ active: isActive('rectangle') }" @click="toggle('rectangle')">
            矩形
          </button>
          <button class="btn" :class="{ active: isActive('ellipse') }" @click="toggle('ellipse')">
            椭圆
          </button>
        </div>
      </div>

      <!-- 体要素 -->
      <div class="section">
        <div class="section-title">
          <span class="dot dot-box"></span>体要素
        </div>
        <p class="section-desc">box / cylinder / ellipsoid / 拉伸 / 走廊 / 墙体</p>
        <div class="btn-group">
          <button class="btn" :class="{ active: isActive('box') }" @click="toggle('box')">立方体</button>
          <button class="btn" :class="{ active: isActive('cylinder') }" @click="toggle('cylinder')">圆柱</button>
          <button class="btn" :class="{ active: isActive('ellipsoid') }" @click="toggle('ellipsoid')">椭球</button>
          <button class="btn" :class="{ active: isActive('polygon-extruded') }" @click="toggle('polygon-extruded')">
            拉伸多边形
          </button>
          <button class="btn" :class="{ active: isActive('corridor') }" @click="toggle('corridor')">走廊</button>
          <button class="btn" :class="{ active: isActive('wall') }" @click="toggle('wall')">墙体</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue';
import * as Cesium from 'cesium';

declare global {
  interface Window {
    Cesium: typeof Cesium;
    currentViewer: Cesium.Viewer;
  }
}

window.Cesium = Cesium; // 挂载到全局，方便控制台调试

const viewer = shallowRef<Cesium.Viewer | null>(null);

/** 形体是否已添加（用于按钮高亮与增删切换） */
const activeKeys = reactive<Record<string, boolean>>({});

/** 简写：经纬度 -> 笛卡尔坐标 */
function pos(lng: number, lat: number, height = 0) {
  return Cesium.Cartesian3.fromDegrees(lng, lat, height);
}

/** 绿色系确认色，各分类主色 */
const COLOR_POINT = Cesium.Color.fromCssColorString('#ff5a5f');
const COLOR_LINE = Cesium.Color.fromCssColorString('#00d1ff');
const COLOR_POLYGON = Cesium.Color.fromCssColorString('#ffb020');
const COLOR_BOX = Cesium.Color.fromCssColorString('#7c5cff');

// ============ 点要素 ============
function addPointBasic() {
  getViewer().entities.add({
    id: 'point-basic',
    name: '基础点',
    position: pos(115.1, 40.5),
    point: {
      pixelSize: 14, // 屏幕像素大小（不随缩放变化）
      color: COLOR_POINT,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不被地形/地球遮挡
    },
  });
}

function addPointLabel() {
  getViewer().entities.add({
    id: 'point-label',
    name: '带标签的点',
    position: pos(115.45, 40.35),
    point: { pixelSize: 10, color: Cesium.Color.WHITE, outlineColor: COLOR_POINT, outlineWidth: 3 },
    label: {
      text: '这是一个标签',
      font: '15px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -28), // 相对点的屏幕偏移
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

function addPointBillboard() {
  // 用内联 SVG 生成一个小图标，避免依赖外部图片
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <path d="M24 4c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#00d1ff" stroke="#fff" stroke-width="2"/>
    <circle cx="24" cy="16" r="5" fill="#fff"/>
  </svg>`;
  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  getViewer().entities.add({
    id: 'point-billboard',
    name: '图标点',
    position: pos(115.8, 40.5),
    billboard: {
      image,
      width: 32, // 宽度固定时高度等比缩放
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 图标底部对齐坐标点
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

// ============ 线要素 ============
function addLineBasic() {
  getViewer().entities.add({
    id: 'line-basic',
    name: '基础线',
    polyline: {
      positions: [pos(115.0, 39.9), pos(115.5, 39.7), pos(116.0, 39.9)],
      width: 5,
      material: COLOR_LINE,
      clampToGround: false,
    },
  });
}

function addLineDash() {
  getViewer().entities.add({
    id: 'line-dash',
    name: '虚线',
    polyline: {
      positions: [pos(115.0, 39.45), pos(116.0, 39.45)],
      width: 4,
      // 虚线材质：dashLength 为一段虚线的长度（像素）
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.YELLOW,
        dashLength: 20,
      }),
    },
  });
}

function addLineArrow() {
  getViewer().entities.add({
    id: 'line-arrow',
    name: '箭头线',
    polyline: {
      positions: [pos(115.0, 39.2), pos(115.8, 39.35)],
      width: 12,
      // 箭头材质：沿线的走向绘制箭头
      material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.LIME),
    },
  });
}

function addLineClamp() {
  getViewer().entities.add({
    id: 'line-clamp',
    name: '贴地线',
    polyline: {
      positions: [pos(115.2, 38.95), pos(115.7, 39.05), pos(116.0, 38.9)],
      width: 6,
      material: Cesium.Color.MAGENTA,
      clampToGround: true, // 贴合地形/椭球表面
    },
  });
}

// ============ 面要素 ============
function addPolygonBasic() {
  getViewer().entities.add({
    id: 'polygon-basic',
    name: '多边形',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([117.0, 40.3, 117.5, 40.5, 117.7, 40.2, 117.2, 40.05]),
      material: COLOR_POLYGON.withAlpha(0.6), // 半透明更易看出填充效果
    },
  });
}

function addPolygonOutline() {
  getViewer().entities.add({
    id: 'polygon-outline',
    name: '描边多边形',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([117.0, 39.9, 117.6, 39.9, 117.6, 39.5, 117.0, 39.5]),
      material: Cesium.Color.CYAN.withAlpha(0.35),
      outline: true, // 只描边不显示表面
      outlineColor: Cesium.Color.CYAN,
      outlineWidth: 3,
    },
  });
}

function addPolygonClamp() {
  getViewer().entities.add({
    id: 'polygon-clamp',
    name: '贴地多边形',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([117.1, 39.25, 117.7, 39.3, 117.5, 38.95]),
      material: Cesium.Color.LIME.withAlpha(0.5),
      // 不设置 height / extrudedHeight 时，多边形默认作为 GroundPrimitive 贴合地表
    },
  });
}

function addRectangle() {
  getViewer().entities.add({
    id: 'rectangle',
    name: '矩形',
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(117.9, 39.3, 118.35, 39.75),
      material: Cesium.Color.fromCssColorString('#ff7ac6').withAlpha(0.55),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#ff7ac6'),
      outlineWidth: 2,
      height: 5000, // 抬升 5km，避免与地表 z-fighting
    },
  });
}

function addEllipse() {
  getViewer().entities.add({
    id: 'ellipse',
    name: '椭圆',
    position: pos(117.95, 40.3),
    ellipse: {
      semiMajorAxis: 30000, // 长半轴（米）
      semiMinorAxis: 18000, // 短半轴（米）
      rotation: Cesium.Math.toRadians(30), // 绕中心旋转
      material: Cesium.Color.fromCssColorString('#4dd4ac').withAlpha(0.6),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

// ============ 体要素 ============
function addBox() {
  getViewer().entities.add({
    id: 'box',
    name: '立方体',
    position: pos(116.0, 38.6, 15000),
    box: {
      dimensions: new Cesium.Cartesian3(30000, 30000, 30000), // 长宽高（米）
      material: COLOR_BOX.withAlpha(0.75),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function addCylinder() {
  getViewer().entities.add({
    id: 'cylinder',
    name: '圆柱',
    position: pos(116.55, 38.6, 25000),
    cylinder: {
      length: 50000, // 高度（米）
      topRadius: 15000, // 上底半径，与下底不同则为圆台
      bottomRadius: 25000,
      material: Cesium.Color.fromCssColorString('#2ec4ff').withAlpha(0.75),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function addEllipsoid() {
  getViewer().entities.add({
    id: 'ellipsoid',
    name: '椭球',
    position: pos(117.05, 38.6, 25000),
    ellipsoid: {
      radii: new Cesium.Cartesian3(25000, 18000, 30000), // 三轴半径
      material: Cesium.Color.fromCssColorString('#ffd166').withAlpha(0.75),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function addPolygonExtruded() {
  getViewer().entities.add({
    id: 'polygon-extruded',
    name: '拉伸多边形',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([115.55, 38.25, 116.1, 38.35, 115.95, 38.0, 115.5, 38.05]),
      extrudedHeight: 60000, // 从地表拉伸到指定高度，形成柱体
      material: Cesium.Color.fromCssColorString('#ff9f43').withAlpha(0.7),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function addCorridor() {
  getViewer().entities.add({
    id: 'corridor',
    name: '走廊',
    corridor: {
      positions: Cesium.Cartesian3.fromDegreesArray([116.25, 38.0, 116.45, 38.15, 116.5, 38.3]),
      width: 15000, // 走廊总宽度（米）
      height: 30000, // 从地面抬升的高度，不设置则贴地
      material: Cesium.Color.fromCssColorString('#a0e7a0').withAlpha(0.7),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function addWall() {
  getViewer().entities.add({
    id: 'wall',
    name: '墙体',
    wall: {
      positions: Cesium.Cartesian3.fromDegreesArray([116.9, 38.05, 117.1, 38.2, 117.25, 38.1]),
      // 每个顶点对应的墙顶高度，形成高低起伏的墙
      maximumHeights: [40000, 70000, 35000],
      minimumHeights: [0, 10000, 0],
      material: Cesium.Color.fromCssColorString('#ff6b6b').withAlpha(0.7),
    },
  });
}

// ============ Demo 注册表 ============
const demos: Record<string, () => void> = {
  'point-basic': addPointBasic,
  'point-label': addPointLabel,
  'point-billboard': addPointBillboard,
  'line-basic': addLineBasic,
  'line-dash': addLineDash,
  'line-arrow': addLineArrow,
  'line-clamp': addLineClamp,
  'polygon-basic': addPolygonBasic,
  'polygon-outline': addPolygonOutline,
  'polygon-clamp': addPolygonClamp,
  rectangle: addRectangle,
  ellipse: addEllipse,
  box: addBox,
  cylinder: addCylinder,
  ellipsoid: addEllipsoid,
  'polygon-extruded': addPolygonExtruded,
  corridor: addCorridor,
  wall: addWall,
};

Object.keys(demos).forEach((key) => {
  activeKeys[key] = false;
});

function getViewer(): Cesium.Viewer {
  if (!viewer.value) throw new Error('Viewer 尚未初始化');
  return viewer.value;
}

function isActive(key: string) {
  return activeKeys[key] === true;
}

/** 切换形体：已存在则移除，不存在则添加 */
function toggle(key: string) {
  if (activeKeys[key]) {
    getViewer().entities.removeById(key);
    activeKeys[key] = false;
  } else {
    demos[key]();
    activeKeys[key] = true;
  }
}

function addAll() {
  Object.keys(demos).forEach((key) => {
    if (!activeKeys[key]) {
      demos[key]();
      activeKeys[key] = true;
    }
  });
}

function clearAll() {
  Object.keys(demos).forEach((key) => {
    if (activeKeys[key]) {
      getViewer().entities.removeById(key);
      activeKeys[key] = false;
    }
  });
}

function resetView() {
  getViewer().camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.3, 38.2, 300000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-50),
      roll: 0,
    },
    duration: 1.5,
  });
}

// ============ 初始化 ============
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
  currentViewer.scene.debugShowFramesPerSecond = true;

  // 观察全部几何形体的初始视角
  currentViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.3, 38.2, 300000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-50),
      roll: 0,
    },
  });

  // 默认加载全部示例
  addAll();
});

onBeforeUnmount(() => {
  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy();
  }
});
</script>

<style scoped>
.geometry-demo {
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

.control-panel {
  position: absolute;
  z-index: 10;
  top: 12px;
  left: 12px;
  width: 310px;
  max-height: calc(100vh - 100px);
  padding: 14px 16px;
  overflow-y: auto;
  border: 1px solid rgb(120 160 220 / 25%);
  border-radius: 10px;
  background: rgb(20 24 35 / 92%);
  box-shadow: 0 4px 20px rgb(0 0 0 / 40%);
  color: #e8edf5;
  font-size: 13px;
}

.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgb(120 160 220 / 40%);
}

.panel-title {
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgb(127 180 255 / 25%);
  color: #7fb4ff;
  font-size: 15px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.section {
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
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

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
}

.dot-point {
  background: #ff5a5f;
}

.dot-line {
  background: #00d1ff;
}

.dot-polygon {
  background: #ffb020;
}

.dot-box {
  background: #7c5cff;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn {
  flex: 1 1 calc(50% - 6px);
  min-width: 108px;
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
  border-color: rgb(150 200 255 / 70%);
  background: rgb(100 150 220 / 45%);
}

.btn.active {
  border-color: #63b3ff;
  background: rgb(60 150 255 / 55%);
  box-shadow: 0 0 8px rgb(80 160 255 / 60%);
}

.btn-action {
  flex: 1;
  min-width: 0;
}
</style>
