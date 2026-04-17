<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useDiskStore } from '@/store/modules/disk';
import FileIcon from './file-icon.vue';
import { formatFileSize } from '@/utils/format';

defineOptions({
  name: 'TransferPanel'
});

const diskStore = useDiskStore();

const isVisible = ref(false);
const viewMode = ref<'list' | 'sphere'>('sphere');

const activeTransfers = computed(() =>
  diskStore.transferList.filter(item => item.status !== 'completed')
);

const hasActiveTransfers = computed(() => activeTransfers.value.length > 0);

const allCompleted = computed(() => {
  const items = diskStore.transferList;
  return items.length > 0 && items.every(item => item.status === 'completed');
});

const isEmpty = computed(() => diskStore.transferList.length === 0);

const overallProgress = computed(() => {
  const items = diskStore.transferList;
  if (items.length === 0) return 0;

  // 计算所有未完成文件的平均进度（包括 pending 和 transferring）
  const activeItems = items.filter(item => item.status !== 'completed');
  if (activeItems.length === 0) return 100; // 全部完成时显示 100%

  const total = activeItems.reduce((sum, item) => sum + item.progress, 0);
  return Math.round(total / activeItems.length);
});


// 水波纹是否可见（有文件在传输或刚完成时显示）
const showWaves = computed(() => {
  const items = diskStore.transferList;
  return items.length > 0 && (overallProgress.value > 0 || items.some(item => item.status === 'transferring'));
});

// SVG 波浪路径生成
function generateWavePath(width: number, amplitude: number, offset: number = 0): string {
  const segments = 40;
  const points: string[] = [];

  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const y = amplitude * Math.sin((i / segments) * Math.PI * 2 + offset) + amplitude;
    points.push(`${x},${y}`);
  }

  // 闭合路径：波浪曲线 + 底部填充区域
  return `M0,${amplitude * 2} L${points.join(' L')} L${width},${amplitude * 2} Z`;
}

// 波浪路径（前层）
const wavePathFront = computed(() => generateWavePath(300, 10, 0));
// 波浪路径（后层）
const wavePathBack = computed(() => generateWavePath(300, 12, Math.PI / 3));

// 波浪垂直位置（基于进度）
const waveTranslateY = computed(() => {
  const sphereHeight = 140;
  // progress=0 → 波浪在底部以下30px（完全不可见）
  // progress=100 → 波浪在顶部（完全填充）
  const offset = sphereHeight + 30 - (sphereHeight + 30) * (overallProgress.value / 100);
  return offset;
});

const totalSpeed = computed(() => {
  const items = activeTransfers.value.filter(item => item.status === 'transferring');
  return items.reduce((sum, item) => sum + item.speed, 0);
});

const activeCount = computed(() => activeTransfers.value.length);

function showSphere() {
  isVisible.value = true;
  viewMode.value = 'sphere';
}

function showList() {
  isVisible.value = true;
  viewMode.value = 'list';
}

function closePanel() {
  isVisible.value = false;
}

function switchToSphere() {
  viewMode.value = 'sphere';
}

function switchToList() {
  viewMode.value = 'list';
}

function cancelTransfer(transferId: string) {
  diskStore.removeTransferItem(transferId);
}

function getStatusColor(status: Api.Disk.TransferItem['status']) {
  const map: Record<string, string> = {
    pending: '#999',
    transferring: 'var(--primary-color)',
    completed: 'var(--n-success-color)',
    failed: 'var(--n-error-color)',
    paused: '#f0a020'
  };
  return map[status] || 'var(--primary-color)';
}

defineExpose({ showSphere, showList });

onMounted(() => {
  if (hasActiveTransfers.value) {
    isVisible.value = true;
    viewMode.value = 'sphere';
  }
});
</script>

<template>
  <div class="fixed right-20px bottom-20px z-1000 flex flex-col items-end gap-8px sm:right-20px sm:bottom-20px lt-sm:right-10px lt-sm:bottom-10px">
    <!-- Unified transition with out-in mode for smooth switching -->
    <Transition name="view-switch" mode="out-in">
      <div v-if="isVisible && viewMode === 'list'" key="list" class="panel-card">
        <!-- Header -->
        <div class="flex justify-between items-center px-12px py-10px border-b-1px border-b-solid border-[var(--primary-color)]/20">
          <div class="flex items-center gap-6px text-12px font-500 dark:text-white/85 text-gray-800">
            <span class="w-5px h-5px rd-full bg-[var(--primary-color)] shadow-[0_0_6px_var(--primary-color)]" />
            <span>传输列表</span>
            <span class="text-10px bg-[var(--primary-color)]/15 dark:text-[var(--primary-400)] text-[var(--primary-600)] px-6px rd-6px">{{ activeCount }}</span>
          </div>
          <div class="flex gap-4px">
            <button class="action-btn text-[var(--primary-color)]" title="球体视图" @click="switchToSphere">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="9" ry="4" />
                <ellipse cx="12" cy="12" rx="4" ry="9" />
              </svg>
            </button>
            <button class="action-btn" @click="closePanel">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Transfer list -->
        <div class="transfer-scroll">
          <div v-for="item in activeTransfers" :key="item.transferId" class="transfer-row">
            <div class="flex justify-between items-center mb-4px">
              <div class="flex items-center gap-6px overflow-hidden">
                <FileIcon :file-type="item.fileType" size="small" />
                <span class="text-12px dark:text-white/80 text-gray-700 whitespace-nowrap truncate max-w-200px">{{ item.fileName }}</span>
              </div>
              <div class="flex items-center gap-6px">
                <span class="text-12px font-600 tabular-nums" :style="{ color: getStatusColor(item.status) }">
                  {{ item.progress }}%
                </span>
                <button
                  v-if="item.status === 'pending' || item.status === 'transferring'"
                  class="cancel-btn"
                  title="取消"
                  @click="cancelTransfer(item.transferId)"
                >
                  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="h-4px rd-2px bg-gray-200 dark:bg-white/6 overflow-hidden">
              <div
                class="h-full rd-2px transition-width duration-300"
                :style="{ width: `${item.progress}%`, background: getStatusColor(item.status) }"
              />
            </div>
            <div v-if="item.status === 'transferring'" class="flex justify-between text-10px dark:text-white/35 text-gray-400 mt-3px tabular-nums">
              <span>{{ formatFileSize(item.speed) }}/s</span>
              <span>{{ item.remainingTime }}s</span>
            </div>
          </div>

          <div v-if="activeTransfers.length === 0" class="text-center text-12px dark:text-white/30 text-gray-400 py-20px">
            暂无传输任务
          </div>
        </div>
      </div>

      <div v-else-if="isVisible && viewMode === 'sphere'" key="sphere" class="flex flex-col items-center gap-8px">
        <!-- Control buttons -->
        <div class="flex justify-end w-160px gap-4px lt-sm:w-130px">
          <button class="action-btn dark:bg-[rgba(15,18,30,0.92)] bg-white/92 border-1px border-solid border-[var(--primary-color)]/20 backdrop-blur-12px" title="列表视图" @click="switchToList">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button class="action-btn dark:bg-[rgba(15,18,30,0.92)] bg-white/92 border-1px border-solid border-[var(--primary-color)]/20 backdrop-blur-12px" @click="closePanel">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Sphere container -->
        <div class="relative w-160px h-160px lt-sm:w-130px lt-sm:h-130px">
          <!-- Outer glow ring -->
          <div class="sphere-glow" />

          <!-- Progress ring -->
          <div class="absolute inset-0">
            <svg class="w-full h-full" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="74" fill="none" stroke="var(--primary-color)" stroke-opacity="8" stroke-width="1.5" />
              <circle
                class="ring-fill"
                cx="80" cy="80" r="74"
                fill="none"
                stroke="url(#sGrad)"
                stroke-width="1.5"
                stroke-linecap="round"
                :stroke-dasharray="`${overallProgress * 4.65} 465`"
                transform="rotate(-90 80 80)"
              />
              <defs>
                <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary-color)" />
                  <stop offset="100%" stop-color="var(--primary-400)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- Sphere body -->
          <div class="sphere-body" :class="{ 'completed-state': allCompleted }">
            <!-- Matrix rain background -->
            <div class="matrix-rain">
              <span v-for="i in 8" :key="i" class="matrix-col" :style="{ animationDelay: `${i * 0.3}s`, left: `${i * 12}%` }">
                01001
              </span>
            </div>

            <!-- SVG 波浪效果 -->
            <svg
              v-if="showWaves"
              class="wave-svg"
              :class="{ 'completed-state': allCompleted }"
              viewBox="0 0 300 170"
              preserveAspectRatio="none"
              :style="{ '--wave-y-front': `${waveTranslateY - 8}px`, '--wave-y-back': `${waveTranslateY}px` }"
            >
              <!-- 后层波浪 - 深色，慢速 -->
              <path
                class="wave-path wave-back"
                :d="wavePathBack"
              />
              <!-- 前层波浪 - 浅色，快速 -->
              <path
                class="wave-path wave-front"
                :d="wavePathFront"
              />
            </svg>

            <!-- Center content -->
            <div class="absolute inset-0 flex flex-col items-center justify-center z-2">
              <!-- Empty state -->
              <template v-if="isEmpty">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--primary-color)" stroke-width="1.2" opacity="0.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8" />
                </svg>
                <span class="text-11px mt-6px opacity-50 dark:text-white/50 text-gray-500">暂无任务</span>
              </template>

              <!-- Completed state -->
              <template v-else-if="allCompleted">
                <div class="check-icon">
                  <svg viewBox="0 0 80 80" width="48" height="48">
                    <circle
                      class="check-bg"
                      cx="40" cy="40" r="36"
                      fill="none"
                      stroke="var(--n-success-color)"
                      stroke-width="2"
                      stroke-dasharray="226"
                      stroke-dashoffset="226"
                    />
                    <path
                      class="check-mark"
                      d="M24 42 L34 52 L56 30"
                      fill="none"
                      stroke="var(--n-success-color)"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="60"
                      stroke-dashoffset="60"
                    />
                  </svg>
                </div>
                <span class="text-11px mt-4px sphere-complete-text" style="color: var(--n-success-color)">传输完成</span>
              </template>

              <!-- Active transfer state -->
              <template v-else>
                <span class="text-24px font-700 dark:text-white text-gray-800 tabular-nums lh-1 sphere-percent">{{ overallProgress }}%</span>
                <span class="text-10px mt-12px tabular-nums opacity-80 dark:text-[var(--primary-400)] text-[var(--primary-600)]">{{ formatFileSize(totalSpeed) }}/s</span>
              </template>
            </div>
          </div>

          <!-- Orbiting particles with trails -->
          <div class="orbit orbit-1">
            <div class="particle particle-1" />
          </div>
          <div class="orbit orbit-2">
            <div class="particle particle-2" />
          </div>
        </div>

        <!-- Bottom info -->
        <div>
          <span v-if="isEmpty" class="text-10px dark:text-white/30 text-gray-400 tracking-0.5px">等待传输任务</span>
          <span v-else-if="allCompleted" class="text-10px sphere-complete-text tracking-0.5px" style="color: var(--n-success-color)">全部完成</span>
          <span v-else class="text-10px dark:text-white/40 text-gray-400 tracking-0.5px">{{ activeCount }} 个任务传输中</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
// ---- Panel card (enlarged) ----
.panel-card {
  width: 320px;
  max-height: 420px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(100, 108, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  overflow: hidden;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.08),
    0 0 1px rgba(100, 108, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);

  :root.dark & {
    background: rgba(15, 18, 30, 0.92);
    box-shadow:
      0 6px 24px rgba(0, 0, 0, 0.3),
      0 0 1px rgba(100, 108, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 640px) {
    width: 280px;
  }
}

// ---- Action buttons ----
.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(100, 108, 255, 0.15);
    color: var(--primary-color);
  }

  :root.dark & {
    color: rgba(255, 255, 255, 0.5);
  }
}

// ---- Cancel button in list ----
.cancel-btn {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 0, 0, 0.1);
    color: var(--n-error-color);
  }

  :root.dark & {
    color: rgba(255, 255, 255, 0.3);
  }
}

// ---- Transfer list ----
.transfer-scroll {
  max-height: 350px;
  overflow-y: auto;
  padding: 6px 8px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(100, 108, 255, 0.2);
    border-radius: 2px;
  }
}

.transfer-row {
  padding: 8px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(100, 108, 255, 0.06);

    :root.dark & {
      background: rgba(100, 108, 255, 0.1);
    }
  }
}

// ---- Sphere outer glow ----
.sphere-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid rgba(100, 108, 255, 0.08);
  animation: pulseGlow 4s ease-in-out infinite;

  :root.dark & {
    border-color: rgba(100, 108, 255, 0.12);
    box-shadow:
      0 0 20px rgba(100, 108, 255, 0.08),
      0 0 40px rgba(100, 108, 255, 0.04);
  }

  @media (max-width: 640px) {
    inset: -6px;
  }
}

// ---- Sphere body ----
.sphere-body {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 40%, rgba(100, 108, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 50% 60%, rgba(100, 108, 255, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(245, 247, 255, 0.95) 0%, rgba(230, 235, 255, 0.98) 100%);
  border: 1px solid rgba(100, 108, 255, 0.15);
  overflow: hidden;
  box-shadow:
    0 0 30px rgba(100, 108, 255, 0.08),
    0 0 60px rgba(100, 108, 255, 0.04),
    inset 0 0 40px rgba(100, 108, 255, 0.03);

  :root.dark & {
    background:
      radial-gradient(circle at 50% 40%, rgba(140, 150, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 50% 60%, rgba(100, 108, 255, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(20, 24, 50, 0.95) 0%, rgba(10, 12, 30, 0.98) 100%);
    border-color: rgba(100, 108, 255, 0.2);
    box-shadow:
      0 0 30px rgba(100, 108, 255, 0.12),
      0 0 60px rgba(100, 108, 255, 0.06),
      inset 0 0 40px rgba(100, 108, 255, 0.04);
  }

  @media (max-width: 640px) {
    top: 8px;
    left: 8px;
    width: 114px;
    height: 114px;
  }
}

// ---- Sphere percent glow ----
.sphere-percent {
  :root.dark & {
    text-shadow: 0 0 16px rgba(100, 108, 255, 0.5);
  }
}

// ---- Matrix rain ----
.matrix-rain {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
  opacity: 0.06;
  pointer-events: none;

  :root.dark & {
    opacity: 0.08;
  }
}

.matrix-col {
  position: absolute;
  top: -100%;
  font-size: 8px;
  font-family: monospace;
  color: var(--primary-color);
  line-height: 1.4;
  writing-mode: vertical-rl;
  animation: matrixRain 6s linear infinite;
  white-space: pre;
}

// ---- SVG 波浪效果 ----
.wave-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 50%;
}

.wave-path {
  fill-opacity: 1;
  transition: fill 0.5s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;

  // 前层波浪 - 浅色，快速流动
  &.wave-front {
    fill: rgba(100, 108, 255, 0.65);
    animation: waveFlowFront 2.5s linear infinite;

    :root.dark & {
      fill: rgba(140, 150, 255, 0.60);
    }
  }

  // 后层波浪 - 深色，慢速流动
  &.wave-back {
    fill: rgba(80, 90, 220, 0.35);
    animation: waveFlowBack 4s linear infinite;

    :root.dark & {
      fill: rgba(100, 110, 245, 0.30);
    }
  }

  // 完成状态 - 绿色
  .completed-state & {
    fill: rgba(82, 196, 26, 0.50) !important;
    animation-play-state: paused !important;

    :root.dark & {
      fill: rgba(82, 196, 26, 0.45) !important;
    }
  }
}

// 波浪横向流动动画
@keyframes waveFlowFront {
  0% { transform: translateX(0) translateY(var(--wave-y-front, 70px)) scaleY(1); }
  50% { transform: translateX(-75px) translateY(var(--wave-y-front, 70px)) scaleY(1.06); }
  100% { transform: translateX(-150px) translateY(var(--wave-y-front, 70px)) scaleY(1); }
}

@keyframes waveFlowBack {
  0% { transform: translateX(0) translateY(var(--wave-y-back, 75px)) scaleY(1); }
  50% { transform: translateX(-75px) translateY(var(--wave-y-back, 75px)) scaleY(1.04); }
  100% { transform: translateX(-150px) translateY(var(--wave-y-back, 75px)) scaleY(1); }
}

// ---- Progress ring glow ----
.ring-fill {
  transition: stroke-dasharray 0.5s ease;
  filter: drop-shadow(0 0 4px rgba(100, 108, 255, 0.5));
}

// ---- Completed checkmark ----
.check-icon {
  animation: checkPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  .check-bg {
    animation: drawCircle 0.6s ease-out 0.1s forwards;
  }

  .check-mark {
    animation: drawCheck 0.4s ease-out 0.5s forwards;
    filter: drop-shadow(0 0 6px rgba(82, 196, 26, 0.5));
  }
}

.sphere-complete-text {
  text-shadow: 0 0 8px rgba(82, 196, 26, 0.4);
  animation: fadeInUp 0.4s ease-out 0.7s both;
}

// ---- Orbits with particle trails ----
.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  pointer-events: none;

  .particle {
    position: absolute;
    border-radius: 50%;
    left: 50%;
    transform: translateX(-50%);
  }

  &.orbit-1 {
    width: 168px;
    height: 168px;
    margin: -84px 0 0 -84px;
    animation: orbitSpin 12s linear infinite;

    .particle-1 {
      width: 4px;
      height: 4px;
      top: -2px;
      background: var(--primary-color);
      box-shadow:
        0 0 8px var(--primary-color),
        0 0 16px rgba(100, 108, 255, 0.4),
        0 0 4px var(--primary-color);
    }

    @media (max-width: 640px) {
      width: 138px;
      height: 138px;
      margin: -69px 0 0 -69px;
    }
  }

  &.orbit-2 {
    width: 184px;
    height: 184px;
    margin: -92px 0 0 -92px;
    animation: orbitSpin 18s linear infinite reverse;

    .particle-2 {
      width: 3px;
      height: 3px;
      bottom: -1.5px;
      top: auto;
      background: var(--primary-400);
      box-shadow:
        0 0 6px var(--primary-400),
        0 0 12px rgba(100, 108, 255, 0.3);
    }

    @media (max-width: 640px) {
      width: 150px;
      height: 150px;
      margin: -75px 0 0 -75px;
    }
  }
}

// ---- Keyframes ----
@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.5;
    box-shadow: 0 0 10px rgba(100, 108, 255, 0.04);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(100, 108, 255, 0.1), 0 0 40px rgba(100, 108, 255, 0.05);
  }
}

@keyframes matrixRain {
  from { transform: translateY(-100%); }
  to { transform: translateY(300%); }
}

@keyframes checkPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes drawCircle {
  to { stroke-dashoffset: 0; }
}

@keyframes drawCheck {
  to { stroke-dashoffset: 0; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes orbitSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ---- Vue transition: unified view-switch with out-in mode ----
.view-switch-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.view-switch-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-switch-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
.view-switch-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
}
</style>
