<template>
  <div class="perf-demo">
    <div id="cesiumContainer"></div>

    <!-- 性能监控面板 -->
    <div class="perf-panel">
      <div class="panel-header">
        <h3>性能监控</h3>
        <div class="header-actions">
          <button class="mini-btn" @click="togglePause">{{ paused ? '继续' : '暂停' }}</button>
          <button class="mini-btn" @click="resetHistory">重置</button>
        </div>
      </div>

      <!-- 核心指标 -->
      <div class="metric-grid">
        <div class="metric" :class="fpsLevel">
          <div class="metric-label">FPS</div>
          <div class="metric-value">{{ stats.fps.toFixed(0) }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">帧间隔</div>
          <div class="metric-value">{{ stats.frameMs.toFixed(1) }}<span class="unit">ms</span></div>
        </div>
        <div class="metric">
          <div class="metric-label">CPU 渲染</div>
          <div class="metric-value">{{ stats.cpuMs.toFixed(2) }}<span class="unit">ms</span></div>
        </div>
        <div class="metric">
          <div class="metric-label">GPU 渲染（估）</div>
          <div class="metric-value">{{ stats.gpuMs.toFixed(2) }}<span class="unit">ms</span></div>
        </div>
      </div>

      <!-- 主线程占用 -->
      <div class="usage-block">
        <div class="usage-title">
          <span>CPU 主线程占用</span>
          <span>{{ stats.cpuUsage.toFixed(0) }}%</span>
        </div>
        <div class="usage-bar">
          <div class="usage-fill" :style="{ width: Math.min(stats.cpuUsage, 100) + '%' }"></div>
        </div>
      </div>

      <!-- 图表 -->
      <div class="chart-block">
        <div class="chart-title">FPS（最近 {{ fpsHistory.length }} 次采样）</div>
        <svg class="spark" viewBox="0 0 240 44" preserveAspectRatio="none">
          <line x1="0" y1="44" x2="240" y2="44" class="axis" />
          <polyline :points="fpsPoints" fill="none" stroke="#4ade80" stroke-width="1.5" />
        </svg>
      </div>

      <div class="chart-block">
        <div class="chart-title">帧间隔 ms</div>
        <svg class="spark" viewBox="0 0 240 44" preserveAspectRatio="none">
          <line x1="0" y1="44" x2="240" y2="44" class="axis" />
          <polyline :points="framePoints" fill="none" stroke="#38bdf8" stroke-width="1.5" />
        </svg>
      </div>

      <!-- 详细信息 -->
      <div class="info-block">
        <div class="info-row">
          <span class="k">JS 堆内存</span>
          <span class="v">{{ memoryText }}</span>
        </div>
        <div class="info-row">
          <span class="k">图元数量</span>
          <span class="v">{{ stats.primitives }}</span>
        </div>
        <div class="info-row">
          <span class="k">实体数量</span>
          <span class="v">{{ stats.entities }}</span>
        </div>
        <div class="info-row">
          <span class="k">相机高度</span>
          <span class="v">{{ (stats.cameraHeight / 1000).toFixed(1) }} km</span>
        </div>
        <div class="info-row">
          <span class="k">渲染分辨率</span>
          <span class="v">{{ renderSize }}</span>
        </div>
        <div class="info-row">
          <span class="k">设备像素比</span>
          <span class="v">{{ pixelRatio.toFixed(2) }}</span>
        </div>
      </div>

      <!-- GPU 信息 -->
      <div class="info-block">
        <div class="block-title">GPU / WebGL</div>
        <div class="info-row">
          <span class="k">渲染器</span>
          <span class="v ellipsis" :title="gpu.renderer">{{ gpu.renderer }}</span>
        </div>
        <div class="info-row">
          <span class="k">厂商</span>
          <span class="v ellipsis" :title="gpu.vendor">{{ gpu.vendor }}</span>
        </div>
        <div class="info-row">
          <span class="k">WebGL</span>
          <span class="v">{{ gpu.webgl }}</span>
        </div>
        <div class="info-row">
          <span class="k">最大纹理</span>
          <span class="v">{{ gpu.maxTexture }}</span>
        </div>
        <div class="info-row">
          <span class="k">Cesium</span>
          <span class="v">{{ cesiumVersion }}</span>
        </div>
      </div>

      <!-- 负载测试 -->
      <div class="info-block">
        <div class="block-title">负载测试</div>
        <div class="btn-group">
          <button class="btn" @click="addStressPoints">加 500 个点</button>
          <button class="btn" @click="clearStressPoints">清除</button>
        </div>
        <p class="tip">观察添加大量实体后 FPS / 帧耗时 / 主线程占用的变化</p>
      </div>

      <div class="panel-tip">提示：GPU 耗时 = 帧间隔 − CPU 渲染耗时（浏览器不暴露真实 GPU 占用，此为估算）</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue';
import * as Cesium from 'cesium';

declare global {
  interface Window {
    Cesium: typeof Cesium;
    viewer: Cesium.Viewer;
  }
}

window.Cesium = Cesium;

const viewer = shallowRef<Cesium.Viewer | null>(null);

// ============ 采样数据 ============
const stats = reactive({
  fps: 0,
  frameMs: 0,
  cpuMs: 0,
  gpuMs: 0,
  cpuUsage: 0,
  primitives: 0,
  entities: 0,
  cameraHeight: 0,
});

const fpsHistory = ref<number[]>([]);
const frameHistory = ref<number[]>([]);
const HISTORY_SIZE = 90;

const paused = ref(false);
const pixelRatio = ref(window.devicePixelRatio || 1);
/** Cesium 的 d.ts 未声明 VERSION，运行时才存在 */
const cesiumVersion = (Cesium as unknown as { VERSION?: string }).VERSION ?? '1.147.0';

const gpu = reactive({
  renderer: '检测中…',
  vendor: '检测中…',
  webgl: '-',
  maxTexture: '-',
});

/** Chrome 私有 API：performance.memory */
interface PerfMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}
const perfMemory = (performance as Performance & { memory?: PerfMemory }).memory;
const memoryText = ref('当前浏览器不支持');

const fpsLevel = computed(() => {
  if (stats.fps >= 50) return 'good';
  if (stats.fps >= 30) return 'mid';
  return 'bad';
});

const renderSize = computed(() => {
  const v = viewer.value;
  if (!v) return '-';
  return `${v.canvas.width} × ${v.canvas.height}`;
});

// ============ 折线图 ============
const CHART_W = 240;
const CHART_H = 44;

function toPoints(values: number[], max: number) {
  const n = values.length;
  if (n === 0) return '';
  const step = n > 1 ? CHART_W / (n - 1) : CHART_W;
  return values
    .map((v, i) => {
      const x = i * step;
      const y = CHART_H - Math.min(Math.max(v, 0) / max, 1) * CHART_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const fpsPoints = computed(() => toPoints(fpsHistory.value, 60));
const framePoints = computed(() => {
  const max = Math.max(33, ...frameHistory.value);
  return toPoints(frameHistory.value, max);
});

// ============ 帧计数 & 计时 ============
let frameCount = 0;
let cpuTimeSum = 0;
let renderStartTime = 0;
let lastSampleAt = performance.now();
let sampleTimer: number | null = null;
let removePreRender: (() => void) | null = null;
let removePostRender: (() => void) | null = null;

function getViewer(): Cesium.Viewer {
  if (!viewer.value) throw new Error('Viewer 尚未初始化');
  return viewer.value;
}

/** 每 400ms 汇总一次帧数据 */
function sample() {
  if (paused.value || !viewer.value) return;

  const now = performance.now();
  const elapsed = now - lastSampleAt;
  if (elapsed <= 0) return;

  const frames = frameCount;
  frameCount = 0;
  const cpuSum = cpuTimeSum;
  cpuTimeSum = 0;
  lastSampleAt = now;

  const frameMs = frames > 0 ? elapsed / frames : 0;
  const fps = frames > 0 ? (frames * 1000) / elapsed : 0;
  const cpuMs = frames > 0 ? cpuSum / frames : 0;
  const gpuMs = Math.max(0, frameMs - cpuMs);

  stats.fps = fps;
  stats.frameMs = frameMs;
  stats.cpuMs = cpuMs;
  stats.gpuMs = gpuMs;
  stats.cpuUsage = frameMs > 0 ? (cpuMs / frameMs) * 100 : 0;

  const v = viewer.value;
  stats.primitives = v.scene.primitives.length;
  stats.entities = v.entities.values.length;
  stats.cameraHeight = v.camera.positionCartographic.height;

  // 记录历史（仅记录有帧的时间段）
  if (frames > 0) {
    fpsHistory.value.push(fps);
    frameHistory.value.push(frameMs);
    if (fpsHistory.value.length > HISTORY_SIZE) fpsHistory.value.shift();
    if (frameHistory.value.length > HISTORY_SIZE) frameHistory.value.shift();
  }

  if (perfMemory) {
    memoryText.value = `${(perfMemory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`;
  }
  pixelRatio.value = window.devicePixelRatio || 1;
}

function resetHistory() {
  fpsHistory.value = [];
  frameHistory.value = [];
  frameCount = 0;
  cpuTimeSum = 0;
  lastSampleAt = performance.now();
}

function togglePause() {
  paused.value = !paused.value;
  if (!paused.value) {
    resetHistory();
  }
}

// ============ GPU 信息检测 ============
function detectGpu() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) {
    gpu.renderer = 'WebGL 不可用';
    gpu.vendor = '-';
    return;
  }

  gpu.webgl = gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as {
    UNMASKED_RENDERER_WEBGL: number;
    UNMASKED_VENDOR_WEBGL: number;
  } | null;

  gpu.renderer = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));
  gpu.vendor = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
    : String(gl.getParameter(gl.VENDOR));
  gpu.maxTexture = String(gl.getParameter(gl.MAX_TEXTURE_SIZE));

  // 及时释放临时上下文
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

// ============ 负载测试 ============
const stressIds: string[] = [];

function addStressPoints() {
  if (stressIds.length > 0) return;
  const v = getViewer();
  for (let i = 0; i < 500; i++) {
    const id = `stress-${i}`;
    v.entities.add({
      id,
      position: Cesium.Cartesian3.fromDegrees(100 + Math.random() * 40, 20 + Math.random() * 30),
      point: {
        pixelSize: 4,
        color: Cesium.Color.CYAN,
      },
    });
    stressIds.push(id);
  }
  resetHistory();
}

function clearStressPoints() {
  const v = getViewer();
  stressIds.forEach((id) => v.entities.removeById(id));
  stressIds.length = 0;
  resetHistory();
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
  window.viewer = currentViewer;
  (currentViewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
  // 用自建面板展示 FPS，关闭 Cesium 自带 FPS 显示
  currentViewer.scene.debugShowFramesPerSecond = false;

  currentViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 12000000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
  });

  // scene.preRender → postRender 之间即为主线程渲染耗时（CPU 侧）
  removePreRender = currentViewer.scene.preRender.addEventListener(() => {
    renderStartTime = performance.now();
  });
  removePostRender = currentViewer.scene.postRender.addEventListener(() => {
    frameCount++;
    if (renderStartTime > 0) {
      cpuTimeSum += performance.now() - renderStartTime;
      renderStartTime = 0;
    }
  });

  detectGpu();
  lastSampleAt = performance.now();
  sampleTimer = window.setInterval(sample, 400);

  // 先跑一次，避免面板初始为 0
  setTimeout(sample, 600);
});

onBeforeUnmount(() => {
  if (sampleTimer) {
    clearInterval(sampleTimer);
    sampleTimer = null;
  }
  removePreRender?.();
  removePreRender = null;
  removePostRender?.();
  removePostRender = null;
  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy();
  }
});
</script>

<style scoped>
.perf-demo {
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

.perf-panel {
  position: absolute;
  z-index: 10;
  top: 12px;
  right: 12px;
  width: 300px;
  max-height: calc(100vh - 110px);
  padding: 14px;
  overflow-y: auto;
  border: 1px solid rgb(120 160 220 / 25%);
  border-radius: 10px;
  background: rgb(18 22 32 / 93%);
  box-shadow: 0 4px 20px rgb(0 0 0 / 45%);
  color: #e8edf5;
  font-size: 12px;
}

.perf-panel::-webkit-scrollbar {
  width: 6px;
}

.perf-panel::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgb(120 160 220 / 40%);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgb(127 180 255 / 25%);
}

.panel-header h3 {
  margin: 0;
  color: #7fb4ff;
  font-size: 15px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.mini-btn {
  padding: 4px 10px;
  border: 1px solid rgb(120 160 220 / 45%);
  border-radius: 5px;
  background: rgb(80 120 180 / 25%);
  color: #e8edf5;
  font-size: 11px;
  cursor: pointer;
}

.mini-btn:hover {
  background: rgb(100 150 220 / 50%);
}

/* 指标卡片 */
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.metric {
  padding: 8px 10px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 8px;
  background: rgb(255 255 255 / 4%);
}

.metric-label {
  margin-bottom: 2px;
  color: #89a;
  font-size: 11px;
}

.metric-value {
  color: #e8edf5;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 20px;
  font-weight: 600;
}

.metric-value .unit {
  margin-left: 2px;
  color: #89a;
  font-size: 11px;
  font-weight: 400;
}

.metric.good .metric-value {
  color: #4ade80;
}

.metric.mid .metric-value {
  color: #fbbf24;
}

.metric.bad .metric-value {
  color: #ff5a5f;
}

/* 占用条 */
.usage-block {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(255 255 255 / 4%);
}

.usage-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #b0c4de;
  font-size: 11px;
}

.usage-bar {
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: rgb(255 255 255 / 10%);
}

.usage-fill {
  height: 100%;
  transition: width 0.3s;
  border-radius: 3px;
  background: linear-gradient(90deg, #38bdf8, #4ade80);
}

/* 图表 */
.chart-block {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(255 255 255 / 4%);
}

.chart-title {
  margin-bottom: 4px;
  color: #b0c4de;
  font-size: 11px;
}

.spark {
  display: block;
  width: 100%;
  height: 44px;
}

.spark .axis {
  stroke-width: 1;
  stroke: rgb(255 255 255 / 10%);
}

/* 信息块 */
.info-block {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(255 255 255 / 4%);
}

.block-title {
  margin-bottom: 6px;
  color: #9ec8ff;
  font-size: 11px;
  font-weight: 600;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 0;
}

.info-row .k {
  flex: 0 0 auto;
  color: #89a;
}

.info-row .v {
  color: #dfe6f0;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  text-align: right;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 按钮 */
.btn-group {
  display: flex;
  gap: 6px;
}

.btn {
  flex: 1;
  padding: 6px 10px;
  transition: all 0.2s;
  border: 1px solid rgb(120 160 220 / 40%);
  border-radius: 6px;
  background: rgb(80 120 180 / 25%);
  color: #e8edf5;
  font-size: 12px;
  cursor: pointer;
}

.btn:hover {
  background: rgb(100 150 220 / 50%);
}

.tip {
  margin: 8px 0 0;
  color: #89a;
  font-size: 11px;
  line-height: 1.5;
}

.panel-tip {
  padding-top: 6px;
  border-top: 1px dashed rgb(255 255 255 / 10%);
  color: #89a;
  font-size: 10px;
  line-height: 1.6;
}
</style>
