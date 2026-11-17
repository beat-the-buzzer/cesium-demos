import type { AppRouteModule } from '@/router/types';

import { getParentLayout, LAYOUT } from '@/router/constant';
import { RoleEnum } from '@/enums/roleEnum';
import { t } from '@/hooks/web/useI18n';

const cesuim: AppRouteModule = {
  path: '/cesuim',
  name: 'Cesuim',
  component: LAYOUT,
  redirect: '/cesuim/basic/page',
  meta: {
    orderNo: 1,
    icon: 'ion:key-outline',
    title: 'cesuim',
  },

  children: [
    {
      path: 'basic',
      name: 'BasicDemo',
      component: LAYOUT,
      meta: {
        title: '基础属性',
      },
      children: [
        {
          path: 'first',
          name: 'First',
          component: () => import('@/views/cesium/basic/first.vue'),
          meta: {
            title: '第一个例子',
          },
        },
        {
          path: 'setting',
          name: 'Setting',
          component: () => import('@/views/cesium/basic/setting.vue'),
          meta: {
            title: '设置项',
          },
        },

        {
          path: 'position',
          name: 'Position',
          component: () => import('@/views/cesium/basic/position.vue'),
          meta: {
            title: '坐标系',
          },
        },

        {
          path: 'camera',
          name: 'Camera',
          component: () => import('@/views/cesium/basic/camera.vue'),
          meta: {
            title: '相机系统',
          },
        },
        {
          path: 'geometry-entity',
          name: 'GeometryEntity',
          component: () => import('@/views/cesium/basic/geometry-entity.vue'),
          meta: {
            title: '几何体(entity)',
          },
        },
        {
          path: 'geometry-primitive',
          name: 'GeometryPrimitive',
          component: () => import('@/views/cesium/basic/geometry-primitive.vue'),
          meta: {
            title: '几何体(primitive)',
          },
        },
        {
          path: 'events',
          name: 'Events',
          component: () => import('@/views/cesium/basic/events.vue'),
          meta: {
            title: '事件',
          },
        },
      ],
    },
    {
      path: 'app',
      name: 'AppDemo',
      component: LAYOUT,
      meta: {
        title: '应用Demo',
      },
      children: [
        {
          path: 'performance',
          name: 'Performance',
          component: () => import('@/views/cesium/app/performance.vue'),
          meta: {
            title: '性能面板',
          },
        },
    
      ],
    },
  ],
};

export default cesuim;
