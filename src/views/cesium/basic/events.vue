<template>
  <div class="events-demo">
    <div id="cesiumContainer"></div>

    <!-- 左侧控制面板 -->
    <div class="control-panel">
      <h3 class="panel-title">Cesium 事件 Demo</h3>

      <div class="toolbar">
        <button class="btn btn-action" @click="addTestEntities">加载测试实体</button>
        <button class="btn btn-action" @click="clearTestEntities">清除实体</button>
        <button class="btn btn-action" @click="clearLogs">清空日志</button>
      </div>

      <!-- 鼠标事件 -->
      <div class="section">
        <div class="section-title">🖱️ 鼠标事件</div>
        <p class="section-desc">ScreenSpaceEventHandler</p>
        <div class="btn-group">
          <label class="toggle">
            <input type="checkbox" v-model="enableLeftClick" />
            <span>左键点击</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableRightClick" />
            <span>右键点击</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableMiddleClick" />
            <span>中键点击</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableDoubleClick" />
            <span>双击</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableMouseMove" />
            <span>移动</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableMouseDownUp" />
            <span>按下/抬起</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableWheel" />
            <span>滚轮</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableDrag" />
            <span>拖拽（自定义）</span>
          </label>
        </div>
      </div>

      <!-- 拾取功能 -->
      <div class="section">
        <div class="section-title">🎯 拾取（Pick）</div>
        <p class="section-desc">点击地图后执行对应拾取逻辑</p>
        <div class="btn-group">
          <button class="btn" :class="{ active: pickMode === 'pick' }" @click="pickMode = 'pick'">
            pick 实体
          </button>
          <button class="btn" :class="{ active: pickMode === 'position' }" @click="pickMode = 'position'">
            pickPosition 地表坐标
          </button>
          <button class="btn" :class="{ active: pickMode === 'drill' }" @click="pickMode = 'drill'">
            drillPick 穿透拾取
          </button>
          <button class="btn" :class="{ active: pickMode === 'measure' }" @click="pickMode = 'measure'">
            测距离（两点）
          </button>
        </div>
      </div>

      <!-- 键盘事件 -->
      <div class="section">
        <div class="section-title">⌨️ 键盘事件</div>
        <p class="section-desc">window keydown / keyup</p>
        <div class="btn-group">
          <label class="toggle">
            <input type="checkbox" v-model="enableKeyboard" />
            <span>启用键盘监听</span>
          </label>
        </div>
        <p class="section-desc hotkeys">
          W：飞向北京 · A：飞向上海 · S：重置 · D：画一条随机线 · Q：清除拾取标记
        </p>
      </div>

      <!-- 场景事件 -->
      <div class="section">
        <div class="section-title">🌏 场景事件</div>
        <p class="section-desc">Camera / Globe / Scene</p>
        <div class="btn-group">
          <label class="toggle">
            <input type="checkbox" v-model="enableCameraChanged" />
            <span>相机姿态 changed</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableCameraPercent" />
            <span>相机位置 percentChanged</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enablePostRender" />
            <span>每帧 postRender</span>
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="enableTileProgress" />
            <span>地形瓦片进度</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 右侧事件日志 -->
    <div class="log-panel">
      <div class="log-header">
        <span>事件日志 · 共 {{ logs.length }} 条</span>
        <button class="btn btn-clear" @click="clearLogs">清空</button>
      </div>
      <div class="log-body" ref="logBodyRef">
        <div
          v-for="(log, idx) in logs"
          :key="idx"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-tag">[{{ log.tag }}]</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">暂无事件，开启左侧开关试试～</div>
      </div>
    </div>

    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="status-k">屏幕</span>
      <span class="status-v">{{ mouseScreen.x.toFixed(0) }}, {{ mouseScreen.y.toFixed(0) }}</span>
      <span class="status-k">地表</span>
      <span class="status-v">{{ mouseGround.lng.toFixed(4) }}, {{ mouseGround.lat.toFixed(4) }}</span>
      <span class="status-k">相机高度</span>
      <span class="status-v">{{ (cameraHeight / 1000).toFixed(1) }} km</span>
      <span class="status-k">拾取模式</span>
      <span class="status-v">{{ pickModeLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import * as Cesium from 'cesium';

declare global {
  interface Window {
    Cesium: typeof Cesium;
    viewer: Cesium.Viewer;
  }
}

window.Cesium = Cesium;

const viewer = shallowRef<Cesium.Viewer | null>(null);

// ============ 开关 ============
const enableLeftClick = ref(true);
const enableRightClick = ref(false);
const enableMiddleClick = ref(false);
const enableDoubleClick = ref(false);
const enableMouseMove = ref(true);
const enableMouseDownUp = ref(false);
const enableWheel = ref(false);
const enableDrag = ref(false);

const enableKeyboard = ref(false);
const enableCameraChanged = ref(false);
const enableCameraPercent = ref(false);
const enablePostRender = ref(false);
const enableTileProgress = ref(false);

// ============ 拾取模式 ============
type PickMode = 'pick' | 'position' | 'drill' | 'measure';
const pickMode = ref<PickMode>('pick');
const pickModeLabel = computed(() => {
  const map: Record<PickMode, string> = {
    pick: 'pick 实体',
    position: 'pickPosition 地表',
    drill: 'drillPick 穿透',
    measure: '测距离',
  };
  return map[pickMode.value];
});

// 测距：存储两个点
const measurePoints = ref<Cesium.Cartesian3[]>([]);
const measureLineId = 'measure-line';
const measureLabelId = 'measure-label';

// ============ 实时状态 ============
const mouseScreen = reactive({ x: 0, y: 0 });
const mouseGround = reactive({ lng: 0, lat: 0, height: 0 });
const cameraHeight = ref(0);

// ============ 日志 ============
type LogType = 'info' | 'pick' | 'scene' | 'keyboard' | 'warn';
interface LogItem {
  time: string;
  tag: string;
  msg: string;
  type: LogType;
}
const logs = ref<LogItem[]>([]);
const logBodyRef = ref<HTMLElement | null>(null);

function pushLog(tag: string, msg: string, type: LogType = 'info') {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  // 控制日志上限，防止爆内存
  if (logs.value.length > 500) logs.value.splice(0, 200);
  logs.value.push({ time, tag, msg, type });
  // 自动滚动到底部
  nextTick(() => {
    if (logBodyRef.value) logBodyRef.value.scrollTop = logBodyRef.value.scrollHeight;
  });
}

function clearLogs() {
  logs.value = [];
}

// ============ 简写 & 工具 ============
function getViewer(): Cesium.Viewer {
  if (!viewer.value) throw new Error('Viewer 尚未初始化');
  return viewer.value;
}

/**
 * 屏幕坐标 → 世界坐标。
 * 优先用 pickPosition（支持地形），失败回退 globe.pick（椭球表面）。
 * 两条路径都失败返回 undefined。
 */
function screenToWorld(windowPos: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
  const v = getViewer();
  // 方式 1：scene.pickPosition 会拾取射线与渲染结果的交点（含地形、模型）
  const pos = v.scene.pickPosition(windowPos);
  if (Cesium.defined(pos)) return pos;
  // 方式 2：globe.pick 仅与椭球/地形求交
  const ray = v.camera.getPickRay(windowPos);
  if (ray) {
    const globePos = v.scene.globe.pick(ray, v.scene);
    if (Cesium.defined(globePos)) return globePos;
  }
  return undefined;
}

/** 世界坐标 → 经纬度字符串 */
function cartesianToStr(p: Cesium.Cartesian3) {
  const c = Cesium.Cartographic.fromCartesian(p);
  return `${Cesium.Math.toDegrees(c.longitude).toFixed(4)}°, ${Cesium.Math.toDegrees(c.latitude).toFixed(4)}°, ${c.height.toFixed(1)}m`;
}

function cartesian2ToStr(p: Cesium.Cartesian2) {
  return `${p.x.toFixed(0)}, ${p.y.toFixed(0)}`;
}

// ============ 测试实体 ============
const testEntityIds = ['pt-a', 'pt-b', 'pt-c', 'rect-1', 'line-1'];

function addTestEntities() {
  const v = getViewer();
  const pointOpts = [
    { id: 'pt-a', lng: 116.3, lat: 39.9, name: '北京', color: Cesium.Color.RED },
    { id: 'pt-b', lng: 121.47, lat: 31.23, name: '上海', color: Cesium.Color.LIME },
    { id: 'pt-c', lng: 113.26, lat: 23.13, name: '广州', color: Cesium.Color.CYAN },
  ];
  pointOpts.forEach((o) => {
    v.entities.add({
      id: o.id,
      name: o.name,
      position: Cesium.Cartesian3.fromDegrees(o.lng, o.lat),
      point: {
        pixelSize: 14,
        color: o.color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: o.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -20),
      },
    });
  });

  // 矩形（放在三个点的上方，可测试 drillPick 穿透）
  v.entities.add({
    id: 'rect-1',
    name: '矩形覆盖层',
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(112.0, 22.0, 123.0, 41.0),
      height: 5000,
      material: Cesium.Color.fromCssColorString('#ffb020').withAlpha(0.3),
      outline: true,
      outlineColor: Cesium.Color.ORANGE,
    },
  });

  // 一条线
  v.entities.add({
    id: 'line-1',
    name: '连线',
    polyline: {
      positions: [
        Cesium.Cartesian3.fromDegrees(116.3, 39.9),
        Cesium.Cartesian3.fromDegrees(121.47, 31.23),
        Cesium.Cartesian3.fromDegrees(113.26, 23.13),
      ],
      width: 3,
      material: Cesium.Color.WHITE,
      clampToGround: true,
    },
  });

  pushLog('init', '已添加测试实体：3 个点 + 1 个矩形 + 1 条线', 'info');
  // 飞入视角
  v.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(117.5, 31, 4500000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-60), roll: 0 },
    duration: 1.5,
  });
}

function clearTestEntities() {
  const v = getViewer();
  testEntityIds.forEach((id) => v.entities.removeById(id));
  pushLog('init', '已清除测试实体', 'info');
}

// ============ 拾取处理 ============
function handlePickMode(winPos: Cesium.Cartesian2) {
  const v = getViewer();
  switch (pickMode.value) {
    case 'pick': {
      const picked = v.scene.pick(winPos);
      if (picked && Cesium.defined(picked)) {
        const id = picked.id;
        // 既可能是 Entity，也可能是 Primitive（带 id 属性）
        if (Cesium.Entity && id instanceof Cesium.Entity) {
          pushLog('pick', `pick 命中实体 "${id.name}" (id=${id.id})`, 'pick');
        } else {
          pushLog('pick', `pick 命中 primitive/graphics, id=${JSON.stringify(id)}`, 'pick');
        }
      } else {
        pushLog('pick', 'pick 未命中任何实体', 'pick');
      }
      break;
    }

    case 'position': {
      const world = screenToWorld(winPos);
      if (world) {
        pushLog('pick', `pickPosition: ${cartesianToStr(world)}`, 'pick');
        // 加一个临时点标记
        v.entities.add({
          position: world,
          point: { pixelSize: 10, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK },
        });
      } else {
        pushLog('pick', 'pickPosition 失败（射线未命中）', 'warn');
      }
      break;
    }

    case 'drill': {
      // drillPick 穿透拾取，最多取 10 层
      const pickedList = v.scene.drillPick(winPos, 10);
      if (pickedList.length > 0) {
        const names = pickedList.map((p) => {
          const id = p.id;
          if (Cesium.Entity && id instanceof Cesium.Entity) return id.name ?? id.id;
          return String(id);
        });
        pushLog('pick', `drillPick 穿透 ${pickedList.length} 层：${names.join(' → ')}`, 'pick');
      } else {
        pushLog('pick', 'drillPick 未命中', 'pick');
      }
      break;
    }

    case 'measure': {
      const world = screenToWorld(winPos);
      if (!world) {
        pushLog('pick', '测距离：未取到地表点', 'warn');
        return;
      }
      measurePoints.value.push(world);
      if (measurePoints.value.length === 1) {
        pushLog('pick', '测距离：已取第 1 点，再点一次取第 2 点', 'pick');
      } else if (measurePoints.value.length === 2) {
        const [a, b] = measurePoints.value;
        const distance = Cesium.Cartesian3.distance(a, b);
        pushLog('pick', `测距离：${distance.toFixed(1)} m`, 'pick');
        // 画线和标签
        v.entities.removeById(measureLineId);
        v.entities.removeById(measureLabelId);
        v.entities.add({
          id: measureLineId,
          polyline: {
            positions: measurePoints.value,
            width: 3,
            material: Cesium.Color.YELLOW,
          },
        });
        const mid = new Cesium.Cartesian3(
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
          (a.z + b.z) / 2
        );
        v.entities.add({
          id: measureLabelId,
          position: mid,
          label: {
            text: `${(distance / 1000).toFixed(2)} km`,
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
          },
        });
        // 重置，准备下一次
        measurePoints.value = [];
      }
      break;
    }
  }
}

function clearMeasure() {
  const v = getViewer();
  v.entities.removeById(measureLineId);
  v.entities.removeById(measureLabelId);
  measurePoints.value = [];
  pushLog('keyboard', '已清除测距标记', 'info');
}

// ============ 事件监听管理 ============
let handler: Cesium.ScreenSpaceEventHandler | null = null;
let cameraChangedListener: (() => void) | null = null;
let postRenderListener: (() => void) | null = null;
let tileProgressListener: ((remaining: number) => void) | null = null;
let keydownListener: ((e: KeyboardEvent) => void) | null = null;

// ScreenSpaceEventHandler 的 movement 参数类型未导出，用 any
type Movement = any;

/** 把多个开关对应到 ScreenSpaceEventType 并注册/注销 */
function syncMouseEvent(type: Cesium.ScreenSpaceEventType, on: boolean, cb: (m: Movement) => void) {
  if (!handler) return;
  if (on) {
    handler.setInputAction(cb, type);
  } else {
    handler.removeInputAction(type);
  }
}

function setupMouseHandlers() {
  if (!handler) return;

  syncMouseEvent(Cesium.ScreenSpaceEventType.LEFT_CLICK, enableLeftClick.value, (m) => {
    pushLog('mouse', `LEFT_CLICK @ ${cartesian2ToStr(m.position)} → ${pickModeLabel.value}`, 'info');
    handlePickMode(m.position);
  });

  syncMouseEvent(Cesium.ScreenSpaceEventType.RIGHT_CLICK, enableRightClick.value, (m) => {
    pushLog('mouse', `RIGHT_CLICK @ ${cartesian2ToStr(m.position)}`, 'info');
  });

  syncMouseEvent(Cesium.ScreenSpaceEventType.MIDDLE_CLICK, enableMiddleClick.value, (m) => {
    pushLog('mouse', `MIDDLE_CLICK @ ${cartesian2ToStr(m.position)}`, 'info');
  });

  syncMouseEvent(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, enableDoubleClick.value, (m) => {
    pushLog('mouse', `LEFT_DOUBLE_CLICK @ ${cartesian2ToStr(m.position)}`, 'info');
  });

  syncMouseEvent(Cesium.ScreenSpaceEventType.MOUSE_MOVE, enableMouseMove.value, (m) => {
    mouseScreen.x = m.endPosition.x;
    mouseScreen.y = m.endPosition.y;
    const world = screenToWorld(m.endPosition);
    if (world) {
      const c = Cesium.Cartographic.fromCartesian(world);
      mouseGround.lng = Cesium.Math.toDegrees(c.longitude);
      mouseGround.lat = Cesium.Math.toDegrees(c.latitude);
      mouseGround.height = c.height;
    }
  });

  syncMouseEvent(Cesium.ScreenSpaceEventType.LEFT_DOWN, enableMouseDownUp.value, (m) => {
    pushLog('mouse', `LEFT_DOWN @ ${cartesian2ToStr(m.position)}`, 'info');
  });
  syncMouseEvent(Cesium.ScreenSpaceEventType.LEFT_UP, enableMouseDownUp.value, (m) => {
    pushLog('mouse', `LEFT_UP   @ ${cartesian2ToStr(m.position)}`, 'info');
  });

  syncMouseEvent(Cesium.ScreenSpaceEventType.WHEEL, enableWheel.value, (m) => {
    // m 的向上/向下由 m 字段区分（滚轮的 movement 值）
    pushLog('mouse', `WHEEL deltaY=${(m as any)?.endPosition?.y ?? (m as any)?.amount ?? '?'}`, 'info');
  });

  // 拖拽：用 LEFT_DOWN + MOUSE_MOVE 组合实现
  if (enableDrag.value) {
    let dragging = false;
    let lastMoveLogAt = 0;
    handler.setInputAction((m: Movement) => {
      dragging = true;
      pushLog('mouse', '拖拽开始', 'info');
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction((m: Movement) => {
      if (!dragging || !m.endPosition) return;
      const now = Date.now();
      if (now - lastMoveLogAt > 400) {
        pushLog('mouse', `拖拽中 @ ${cartesian2ToStr(m.endPosition)}`, 'info');
        lastMoveLogAt = now;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(() => {
      if (dragging) {
        dragging = false;
        pushLog('mouse', '拖拽结束', 'info');
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  } else {
    // 如果拖拽开关关闭但左键仍然有其它用途（比如 LEFT_CLICK 是 pick），
    // 不要移除 LEFT_CLICK，只移除我们自己加上的 DOWN / MOVE / UP 组合。
    // 简化：这里直接 remove 所有三键事件，再由 enableMouseDownUp 决定是否保留按下/抬起
    if (!enableMouseDownUp.value) {
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }
  }
}

/** 重新同步所有监听（开关变更时调用） */
function resyncAllHandlers() {
  if (!handler) return;
  // 先全部清理
  handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
  handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
  // 再按当前开关重建
  setupMouseHandlers();
}

// 监听所有开关变更
watch(
  [
    enableLeftClick,
    enableRightClick,
    enableMiddleClick,
    enableDoubleClick,
    enableMouseMove,
    enableMouseDownUp,
    enableWheel,
    enableDrag,
  ],
  () => resyncAllHandlers(),
  { flush: 'post' }
);

// ============ 场景事件 ============
function setupSceneEvents() {
  const v = getViewer();

  // Camera.changed：当相机姿态变化超过 percentageChanged 阈值时触发
  v.camera.percentageChanged = 0.01;

  // Camera 只有一个 changed 事件，我们根据开关决定监听器里打印什么
  if (enableCameraChanged.value || enableCameraPercent.value) {
    cameraChangedListener = v.camera.changed.addEventListener(() => {
      const h = v.camera.positionCartographic.height;
      cameraHeight.value = h;
      if (enableCameraPercent.value) {
        pushLog('scene', `changed → h=${(h / 1000).toFixed(1)}km`, 'scene');
      }
    });
  }

  if (enablePostRender.value) {
    let lastLog = 0;
    postRenderListener = v.scene.postRender.addEventListener(() => {
      cameraHeight.value = v.camera.positionCartographic.height;
      // 2秒打印一次，避免刷屏
      const now = Date.now();
      if (now - lastLog > 2000) {
        lastLog = now;
        pushLog('scene', `postRender · FPS ${v.scene.debugShowFramesPerSecond ? '' : ''}`, 'scene');
      }
    });
  }

  if (enableTileProgress.value) {
    tileProgressListener = v.scene.globe.tileLoadProgressEvent.addEventListener((remaining) => {
      pushLog('scene', `瓦片加载：剩余 ${remaining}`, 'scene');
    });
  }
}

function teardownSceneEvents() {
  cameraChangedListener?.();
  cameraChangedListener = null;
  postRenderListener?.();
  postRenderListener = null;
  if (tileProgressListener) {
    // Globe.tileLoadProgressEvent 是一个 Event，需传入回调引用才能 remove
    getViewer().scene.globe.tileLoadProgressEvent.removeEventListener(tileProgressListener);
    tileProgressListener = null;
  }
}

watch(
  [enableCameraChanged, enableCameraPercent, enablePostRender, enableTileProgress],
  () => {
    teardownSceneEvents();
    setupSceneEvents();
  }
);

// ============ 键盘事件 ============
function setupKeyboard() {
  if (keydownListener) window.removeEventListener('keydown', keydownListener);
  if (!enableKeyboard.value) return;

  const v = getViewer();
  keydownListener = (e: KeyboardEvent) => {
    // 不干扰输入框
    const target = e.target as HTMLElement;
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

    pushLog('keyboard', `keydown: "${e.key}"`, 'keyboard');
    switch (e.key.toLowerCase()) {
      case 'w':
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(116.3, 39.9, 500000),
          duration: 1.5,
        });
        break;
      case 'a':
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(121.47, 31.23, 500000),
          duration: 1.5,
        });
        break;
      case 's':
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 15000000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
          duration: 2,
        });
        break;
      case 'd': {
        const p1 = Cesium.Cartesian3.fromDegrees(Math.random() * 20 + 100, Math.random() * 15 + 25);
        const p2 = Cesium.Cartesian3.fromDegrees(Math.random() * 20 + 100, Math.random() * 15 + 25);
        v.entities.add({
          polyline: { positions: [p1, p2], width: 4, material: Cesium.Color.fromCssColorString('#ff5a5f') },
        });
        pushLog('keyboard', '已添加随机线', 'keyboard');
        break;
      }
      case 'q':
        clearMeasure();
        break;
    }
  };
  window.addEventListener('keydown', keydownListener);
  pushLog('keyboard', '键盘监听已启用，按 W/A/S/D/Q 试试', 'keyboard');
}

watch(enableKeyboard, () => setupKeyboard());

// ============ 初始化 ============
onMounted(() => {
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(75.0, 0.0, 140.0, 60.0);

  const currentViewer = new Cesium.Viewer('cesiumContainer', {
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'))
    ),
  });

  viewer.value = currentViewer;
  window.viewer = currentViewer;
  (currentViewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
  currentViewer.scene.debugShowFramesPerSecond = true;

  // 初始化 ScreenSpaceEventHandler
  handler = new Cesium.ScreenSpaceEventHandler(currentViewer.scene.canvas);
  resyncAllHandlers();
  setupSceneEvents();
  setupKeyboard();

  // 初始相机
  currentViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(117.5, 31, 4500000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-60), roll: 0 },
  });

  pushLog('init', 'Cesium Viewer 初始化完成，事件监听已就绪', 'info');
  addTestEntities();
});

onBeforeUnmount(() => {
  handler?.destroy();
  handler = null;
  teardownSceneEvents();
  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener);
    keydownListener = null;
  }
  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy();
  }
});
</script>

<style scoped>
.events-demo {
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

/* 左侧控制面板 */
.control-panel {
  position: absolute;
  z-index: 10;
  top: 12px;
  left: 12px;
  width: 290px;
  max-height: calc(100vh - 150px);
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

.section-desc.hotkeys {
  color: #b0c4de;
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

.btn-clear {
  flex: 0 0 auto;
  border-color: rgb(255 100 100 / 50%);
  background: rgb(220 60 60 / 30%);
}

.btn-clear:hover {
  background: rgb(255 80 80 / 50%);
}

.toggle {
  display: flex;
  flex: 1 1 calc(50% - 6px);
  align-items: center;
  min-width: 108px;
  padding: 6px 8px;
  transition: all 0.2s;
  border: 1px solid rgb(120 160 220 / 30%);
  border-radius: 6px;
  background: rgb(80 120 180 / 15%);
  cursor: pointer;
  gap: 6px;
}

.toggle:hover {
  border-color: rgb(150 200 255 / 60%);
  background: rgb(100 150 220 / 30%);
}

.toggle input {
  accent-color: #63b3ff;
}

/* 右侧日志面板 */
.log-panel {
  position: absolute;
  right: 12px;
  bottom: 48px;
  width: 320px;
  height: 320px;
  border: 1px solid rgb(120 160 220 / 25%);
  border-radius: 10px;
  background: rgb(16 20 30 / 92%);
  box-shadow: 0 4px 20px rgb(0 0 0 / 40%);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 10px;
  border-bottom: 1px solid rgb(127 180 255 / 25%);
  color: #7fb4ff;
  font-size: 12px;
  font-weight: 600;
}

.log-body {
  height: calc(100% - 32px);
  padding: 6px 10px;
  overflow-y: auto;
  color: #dfe6f0;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
}

.log-body::-webkit-scrollbar {
  width: 6px;
}

.log-body::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgb(120 160 220 / 40%);
}

.log-item {
  display: flex;
  gap: 6px;
  padding: 2px 0;
  border-bottom: 1px dashed rgb(255 255 255 / 5%);
}

.log-time {
  color: #89a;
}

.log-tag {
  flex-shrink: 0;
  color: #7fb4ff;
}

.log-item.pick .log-tag {
  color: #ffb020;
}

.log-item.scene .log-tag {
  color: #a0e7a0;
}

.log-item.keyboard .log-tag {
  color: #ff7ac6;
}

.log-item.warn .log-msg {
  color: #ff5a5f;
}

.log-empty {
  padding-top: 12px;
  color: #89a;
  text-align: center;
}

/* 底部状态栏 */
.status-bar {
  display: flex;
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 314px;
  flex-wrap: wrap;
  padding: 8px 14px;
  border: 1px solid rgb(120 160 220 / 25%);
  border-radius: 8px;
  background: rgb(20 24 35 / 92%);
  box-shadow: 0 4px 20px rgb(0 0 0 / 40%);
  color: #e8edf5;
  font-size: 12px;
  gap: 10px 18px;
}

.status-k {
  color: #7fb4ff;
}

.status-v {
  color: #ffd666;
}
</style>
