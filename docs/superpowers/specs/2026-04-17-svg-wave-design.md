# Transfer Panel SVG 波浪效果设计

## 背景

当前 `transfer-panel.vue` 使用 CSS border-radius 不均匀圆角模拟水波纹，效果较为抽象，缺乏真实波浪感。需要替换为 SVG 正弦波浪动画，实现更自然的液体填充效果。

## 目标效果

参考 `水波纹.png`：
- 球体内填充液体波浪
- 波浪呈正弦曲线起伏
- 多层波浪叠加创造立体感
- 进度变化时波浪高度平滑过渡
- 完成后显示对号图标

## 技术方案

### SVG 波浪路径

使用 SVG `<path>` 绘制正弦曲线：

```typescript
// 波浪路径生成
function generateWavePath(
  width: number,      // 波浪图案宽度
  height: number,     // 波浪高度（正弦振幅）
  segments: number    // 分段数量
): string {
  // y = amplitude × sin(frequency × x + phase)
  // 返回闭合路径：波浪曲线 + 底部填充区域
}
```

### 波浪层级

| 层级 | 颜色 | 透明度 | 动画时长 | 位置偏移 |
|------|------|---------|----------|----------|
| 前层 | primary-500 | 0.65 | 2.5s | offset: 0 |
| 后层 | primary-600 | 0.35 | 4s | offset: 20px |

### 进度控制

```typescript
// 波浪垂直位置
const waveOffset = computed(() => {
  const sphereHeight = 140; // 球体高度
  // progress=0 → 波浪在底部以下（不可见）
  // progress=100 → 波浪在顶部（完全填充）
  return sphereHeight * (1 - overallProgress.value / 100);
});
```

### CSS 动画

```scss
// 波浪横向流动
@keyframes waveFlow {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

// 波浪微起伏
@keyframes waveBreath {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.08); }
}
```

### 完成状态

- 波浪动画暂停
- 颜色变为 success 绿色
- 球体正中间显示对号图标
- 平滑过渡无突变

### 暗黑模式适配

| 层级 | 浅色模式 | 暗黑模式 |
|------|---------|---------|
| 前层 | rgba(100,108,255,0.65) | rgba(140,150,255,0.60) |
| 后层 | rgba(80,90,220,0.35) | rgba(100,110,245,0.30) |
| 完成 | rgba(82,196,26,0.50) | rgba(82,196,26,0.45) |

## 实现步骤

1. 添加波浪路径生成函数（在组件 setup 中）
2. 替换 `.wave-container` HTML 结构为 SVG
3. 添加波浪流动/起伏动画 CSS
4. 调整进度计算逻辑
5. 测试浅色/暗黑模式
6. 测试完成状态对号显示

## 保留功能

- 完成状态对号图标（已有实现，保留）
- 矩阵雨背景效果
- 进度环
- 粒子轨道