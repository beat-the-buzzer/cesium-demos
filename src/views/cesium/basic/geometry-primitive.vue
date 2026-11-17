<template>
  <div class="geometry-demo">
    <div id="cesiumContainer"></div>

    <!-- 左侧控制面板 -->
    <div class="control-panel">
      <h3 class="panel-title">几何形体 Demo（Primitive API）</h3>

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
        <p class="section-desc">PointPrimitiveCollection / LabelCollection / BillboardCollection</p>
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
        <p class="section-desc">PolylineCollection / GroundPolylinePrimitive</p>
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
        <p class="section-desc">PolygonGeometry / RectangleGeometry / EllipseGeometry / GroundPrimitive</p>
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
        <p class="section-desc">Box / Cylinder / Ellipsoid / 拉伸 / Corridor / Wall Geometry</p>
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

/** key -> 移除函数，用于切换/清空时销毁 primitive */
const removers = new Map<string, () => void>();

/**
 * Primitive API 中同类图元使用"集合"批量管理：
 * 点 / 标签 / 图标 / 线 各自一个 Collection，初始化时整体加入 scene.primitives
 */
const pointCollection = new Cesium.PointPrimitiveCollection();
const labelCollection = new Cesium.LabelCollection();
const billboardCollection = new Cesium.BillboardCollection();
const polylineCollection = new Cesium.PolylineCollection();

/** 简写：经纬度 -> 笛卡尔坐标 */
function pos(lng: number, lat: number, height = 0) {
  return Cesium.Cartesian3.fromDegrees(lng, lat, height);
}

/** 各分类主色 */
const COLOR_POINT = Cesium.Color.fromCssColorString('#ff5a5f');
const COLOR_LINE = Cesium.Color.fromCssColorString('#00d1ff');
const COLOR_POLYGON = Cesium.Color.fromCssColorString('#ffb020');
const COLOR_BOX = Cesium.Color.fromCssColorString('#7c5cff');

// ============ 公共工具 ============

function getViewer(): Cesium.Viewer {
  if (!viewer.value) throw new Error('Viewer 尚未初始化');
  return viewer.value;
}

/** 把 primitive 加入场景，返回移除函数 */
function addPrimitive(primitive: Cesium.Primitive | Cesium.GroundPrimitive | Cesium.GroundPolylinePrimitive) {
  const scene = getViewer().scene;
  scene.primitives.add(primitive);
  return () => {
    scene.primitives.remove(primitive);
  };
}

/**
 * 用 Geometry + GeometryInstance + Primitive 组装一个带颜色的 primitive。
 * - ColorGeometryInstanceAttribute：给每个实例单独上色
 * - PerInstanceColorAppearance：按实例颜色着色（替代 Entity 的 material）
 * 注：Cesium 的几何类与 GeometryInstance 接受的类型在 d.ts 中不完全兼容，这里复用官方类型
 */
type GeometryInput = ConstructorParameters<typeof Cesium.GeometryInstance>[0]['geometry'];

function colorPrimitive(
  geometry: GeometryInput,
  color: Cesium.Color,
  options: {
    modelMatrix?: Cesium.Matrix4;
    translucent?: boolean;
    closed?: boolean;
  } = {}
) {
  const instance = new Cesium.GeometryInstance({
    geometry,
    modelMatrix: options.modelMatrix,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
    },
  });

  return new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: options.translucent ?? false,
      closed: options.closed ?? false,
    }),
    asynchronous: false,
  });
}

// ============ 点要素 ============
function addPointBasic() {
  const point = pointCollection.add({
    position: pos(115.1, 40.5),
    pixelSize: 14,
    color: COLOR_POINT,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });
  return () => pointCollection.remove(point);
}

function addPointLabel() {
  const point = pointCollection.add({
    position: pos(115.45, 40.35),
    pixelSize: 10,
    color: Cesium.Color.WHITE,
    outlineColor: COLOR_POINT,
    outlineWidth: 3,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });
  const label = labelCollection.add({
    position: pos(115.45, 40.35),
    text: '这是一个标签',
    font: '15px sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    pixelOffset: new Cesium.Cartesian2(0, -28),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });
  return () => {
    pointCollection.remove(point);
    labelCollection.remove(label);
  };
}

function addPointBillboard() {
  // 用内联 SVG 生成一个小图标，避免依赖外部图片
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <path d="M24 4c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#00d1ff" stroke="#fff" stroke-width="2"/>
    <circle cx="24" cy="16" r="5" fill="#fff"/>
  </svg>`;
  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const billboard = billboardCollection.add({
    position: pos(115.8, 40.5),
    image,
    width: 32,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });
  return () => billboardCollection.remove(billboard);
}

// ============ 线要素 ============
function addLineBasic() {
  const line = polylineCollection.add({
    positions: [pos(115.0, 39.9), pos(115.5, 39.7), pos(116.0, 39.9)],
    width: 5,
    // Primitive 的材质是 Material 实例，而不是 Entity 的 *MaterialProperty
    material: Cesium.Material.fromType('Color', { color: COLOR_LINE }),
  });
  return () => polylineCollection.remove(line);
}

function addLineDash() {
  const line = polylineCollection.add({
    positions: [pos(115.0, 39.45), pos(116.0, 39.45)],
    width: 4,
    material: Cesium.Material.fromType('PolylineDash', {
      color: Cesium.Color.YELLOW,
      dashLength: 20,
    }),
  });
  return () => polylineCollection.remove(line);
}

function addLineArrow() {
  const line = polylineCollection.add({
    positions: [pos(115.0, 39.2), pos(115.8, 39.35)],
    width: 8,
    material: Cesium.Material.fromType('PolylineArrow', { color: Cesium.Color.LIME }),
  });
  return () => polylineCollection.remove(line);
}

/** 贴地线：必须使用 GroundPolyline 系列（普通 Polyline 不贴地） */
function addLineClamp() {
  const primitive = new Cesium.GroundPolylinePrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.GroundPolylineGeometry({
        positions: [pos(115.2, 38.95), pos(115.7, 39.05), pos(116.0, 38.9)],
        width: 6,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.MAGENTA),
      },
    }),
    appearance: new Cesium.PolylineColorAppearance(),
  });
  return addPrimitive(primitive);
}

// ============ 面要素 ============
function addPolygonBasic() {
  // 抬高 5km 避免与地球表面 z-fighting（贴地请看"贴地多边形"）
  const primitive = colorPrimitive(
    new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray([117.0, 40.3, 117.5, 40.5, 117.7, 40.2, 117.2, 40.05])
      ),
      height: 5000,
    }),
    COLOR_POLYGON.withAlpha(0.6),
    { translucent: true }
  );
  return addPrimitive(primitive);
}

/** 描边多边形：面用 Primitive，边用 Polyline 沿轮廓绘制 */
function addPolygonOutline() {
  const ring = [117.0, 39.9, 117.6, 39.9, 117.6, 39.5, 117.0, 39.5];
  const HEIGHT = 3000;

  const fill = colorPrimitive(
    new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ring)),
      height: HEIGHT,
    }),
    Cesium.Color.CYAN.withAlpha(0.35),
    { translucent: true }
  );
  const removeFill = addPrimitive(fill);

  // 闭合轮廓：首尾点重复
  const heights: number[] = [];
  for (let i = 0; i < ring.length; i += 2) {
    heights.push(ring[i]!, ring[i + 1]!, HEIGHT);
  }
  heights.push(ring[0]!, ring[1]!, HEIGHT);

  const outline = polylineCollection.add({
    positions: Cesium.Cartesian3.fromDegreesArrayHeights(heights),
    width: 3,
    material: Cesium.Material.fromType('Color', { color: Cesium.Color.CYAN }),
  });

  return () => {
    removeFill();
    polylineCollection.remove(outline);
  };
}

/** 贴地多边形：使用 GroundPrimitive 贴合地形/椭球 */
function addPolygonClamp() {
  const primitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray([117.1, 39.25, 117.7, 39.3, 117.5, 38.95])
        ),
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.LIME.withAlpha(0.5)),
      },
    }),
    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
    classificationType: Cesium.ClassificationType.BOTH,
  });
  return addPrimitive(primitive);
}

function addRectangle() {
  const primitive = colorPrimitive(
    new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromDegrees(117.9, 39.3, 118.35, 39.75),
      height: 5000,
    }),
    Cesium.Color.fromCssColorString('#ff7ac6').withAlpha(0.55),
    { translucent: true }
  );
  return addPrimitive(primitive);
}

function addEllipse() {
  const primitive = colorPrimitive(
    new Cesium.EllipseGeometry({
      center: pos(117.95, 40.3),
      semiMajorAxis: 30000,
      semiMinorAxis: 18000,
      rotation: Cesium.Math.toRadians(30),
      height: 5000,
    }),
    Cesium.Color.fromCssColorString('#4dd4ac').withAlpha(0.6),
    { translucent: true }
  );
  return addPrimitive(primitive);
}

// ============ 体要素 ============
function addBox() {
  // BoxGeometry 以原点为中心，用 ENU 变换矩阵把它平移到目标位置
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(pos(116.0, 38.6, 15000));
  const primitive = colorPrimitive(
    Cesium.BoxGeometry.fromDimensions({
      dimensions: new Cesium.Cartesian3(30000, 30000, 30000),
    }),
    COLOR_BOX.withAlpha(0.75),
    { modelMatrix, translucent: true, closed: true }
  );
  return addPrimitive(primitive);
}

function addCylinder() {
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(pos(116.55, 38.6, 25000));
  const primitive = colorPrimitive(
    new Cesium.CylinderGeometry({
      length: 50000,
      topRadius: 15000,
      bottomRadius: 25000,
    }),
    Cesium.Color.fromCssColorString('#2ec4ff').withAlpha(0.75),
    { modelMatrix, translucent: true, closed: true }
  );
  return addPrimitive(primitive);
}

function addEllipsoid() {
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(pos(117.05, 38.6, 25000));
  const primitive = colorPrimitive(
    new Cesium.EllipsoidGeometry({
      radii: new Cesium.Cartesian3(25000, 18000, 30000),
    }),
    Cesium.Color.fromCssColorString('#ffd166').withAlpha(0.75),
    { modelMatrix, translucent: true, closed: true }
  );
  return addPrimitive(primitive);
}

function addPolygonExtruded() {
  const primitive = colorPrimitive(
    new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray([115.55, 38.25, 116.1, 38.35, 115.95, 38.0, 115.5, 38.05])
      ),
      extrudedHeight: 60000, // 面 -> 柱体
    }),
    Cesium.Color.fromCssColorString('#ff9f43').withAlpha(0.7),
    { translucent: true, closed: true }
  );
  return addPrimitive(primitive);
}

function addCorridor() {
  const primitive = colorPrimitive(
    new Cesium.CorridorGeometry({
      positions: Cesium.Cartesian3.fromDegreesArray([116.25, 38.0, 116.45, 38.15, 116.5, 38.3]),
      width: 15000,
      height: 0,
      extrudedHeight: 30000,
    }),
    Cesium.Color.fromCssColorString('#a0e7a0').withAlpha(0.7),
    { translucent: true, closed: true }
  );
  return addPrimitive(primitive);
}

function addWall() {
  const primitive = colorPrimitive(
    new Cesium.WallGeometry({
      positions: Cesium.Cartesian3.fromDegreesArray([116.9, 38.05, 117.1, 38.2, 117.25, 38.1]),
      maximumHeights: [40000, 70000, 35000],
      minimumHeights: [0, 10000, 0],
    }),
    Cesium.Color.fromCssColorString('#ff6b6b').withAlpha(0.7),
    { translucent: true }
  );
  return addPrimitive(primitive);
}

// ============ Demo 注册表 ============
/** 每个 demo 返回清理函数，用于移除已添加的图元 */
const demos: Record<string, () => () => void> = {
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

function isActive(key: string) {
  return activeKeys[key] === true;
}

/** 切换形体：已存在则移除，不存在则添加 */
function toggle(key: string) {
  if (activeKeys[key]) {
    remove(key);
  } else {
    removers.set(key, demos[key]!());
    activeKeys[key] = true;
  }
}

function remove(key: string) {
  const cleanup = removers.get(key);
  if (cleanup) {
    cleanup();
    removers.delete(key);
  }
  activeKeys[key] = false;
}

function addAll() {
  Object.keys(demos).forEach((key) => {
    if (!activeKeys[key]) {
      removers.set(key, demos[key]!());
      activeKeys[key] = true;
    }
  });
}

function clearAll() {
  [...removers.keys()].forEach((key) => remove(key));
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

  // 点 / 标签 / 图标 / 线集合统一加入场景
  currentViewer.scene.primitives.add(pointCollection);
  currentViewer.scene.primitives.add(labelCollection);
  currentViewer.scene.primitives.add(billboardCollection);
  currentViewer.scene.primitives.add(polylineCollection);

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
