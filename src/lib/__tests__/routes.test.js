import assert from 'node:assert/strict';
import test from 'node:test';

import { getRoutePath, normalizePath } from '../routes.js';

test('GitHub Pages 首页路径会识别为工具箱首页', () => {
  assert.equal(normalizePath('/dashauichen/', '/dashauichen/'), '/');
});

test('点击首页卡片后的 hash 路由会识别为箱唛页面', () => {
  assert.equal(getRoutePath({
    baseUrl: '/dashauichen/',
    hash: '#/carton-mark',
    pathname: '/dashauichen/'
  }), '/carton-mark');
});

test('点击首页卡片后的 hash 路由会识别为装箱单页面', () => {
  assert.equal(getRoutePath({
    baseUrl: '/dashauichen/',
    hash: '#/packing-list',
    pathname: '/dashauichen/'
  }), '/packing-list');
});
