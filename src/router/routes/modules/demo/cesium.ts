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
      ],
    },
  ],
};

export default cesuim;
