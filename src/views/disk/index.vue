<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { MenuOption } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useDiskStore } from '@/store/modules/disk';
import { useSvgIcon } from '@/hooks/common/icon';
import DiskSider from './modules/disk-sider.vue';
import FileDiskplayGrid from './modules/disk-show-grid.vue';

const appStore = useAppStore();
const diskStore = useDiskStore();
const { SvgIconVNode } = useSvgIcon();

const showCapacity = ref(false);
const isBatchMode = ref(false);
const searchKeyword = ref<string>('');
const currentMode = ref<string>('grid');
const gap = computed(() => (appStore.isMobile ? 0 : 16));

const fileList = computed(() => diskStore.fileList);

/** 切换显示容量 */
function handleChange(value: boolean) {
  showCapacity.value = value;
}

/** 切换显示模式 */
function toggleMode() {
  currentMode.value = currentMode.value === 'grid' ? 'list' : 'grid';
}
// 搜索文件
function handleSearch() {
  if (!searchKeyword.value) {
    window.$message?.destroyAll();
    window.$message?.error('请输入搜索关键词');
    return;
  }
  window.$message?.destroyAll();
  window.$message?.success(`搜索关键词：${searchKeyword.value}`);
}

const menuOptions: MenuOption[] = [
  {
    label: '文件类型',
    key: 'file-type',
    icon: SvgIconVNode({ localIcon: 'disk-cloud_file', fontSize: 24 }),
    children: [
      {
        label: '全部',
        key: 'all',
        icon: SvgIconVNode({ localIcon: 'disk-menu_file', fontSize: 24 })
      },
      {
        label: '图片',
        key: 'image',
        icon: SvgIconVNode({ localIcon: 'disk-file_image', fontSize: 24 })
      },
      {
        label: '文档',
        key: 'document',
        icon: SvgIconVNode({ localIcon: 'disk-file_txt', fontSize: 24 })
      },
      {
        label: '视频',
        key: 'video',
        icon: SvgIconVNode({ localIcon: 'disk-file_video', fontSize: 24 })
      },
      {
        label: '音频',
        key: 'audio',
        icon: SvgIconVNode({ localIcon: 'disk-file_music', fontSize: 24 })
      },
      {
        label: '其他',
        key: 'other',
        icon: SvgIconVNode({ localIcon: 'disk-file_other', fontSize: 24 })
      }
    ]
  }
];

const uploadOptions = [
  {
    key: 'file',
    label: '上传文件',
    icon: SvgIconVNode({ localIcon: 'disk-upload_file', fontSize: 25 }),
    props: {
      onClick: () => {
        // handleFileUpload();
      }
    }
  },
  {
    key: 'folder',
    label: '上传文件夹',
    icon: SvgIconVNode({ localIcon: 'disk-upload_folder', fontSize: 20 }),
    props: {
      onClick: () => {
        // handleFolderUpload();
      }
    }
  }
];

const createOptions = [
  {
    key: 'file',
    label: '新建文件',
    icon: SvgIconVNode({ localIcon: 'disk-create_file', fontSize: 20 }),
    props: {
      onClick: () => {
        window.$message?.destroyAll();
        window.$message?.error('功能开发中');
      }
    }
  },
  {
    key: 'folder',
    label: '新建文件夹',
    icon: SvgIconVNode({ localIcon: 'disk-create_folder', fontSize: 20 }),
    props: {
      onClick: () => {
        window.$message?.destroyAll();
        window.$message?.error('功能开发中');
      }
    }
  }
];
</script>

<template>
  <DiskSider sider-title="文件管理">
    <template #header-extra>
      <NTooltip trigger="hover">
        <template #trigger>
          <NSwitch v-model:value="showCapacity" :round="false" @update:value="handleChange"></NSwitch>
        </template>
        显示容量
      </NTooltip>
    </template>
    <template #sider>
      <div class="h-full flex flex-col select-none">
        <NMenu :options="menuOptions" :default-expanded-keys="['file-type']" accordion class="select-none" />
        <div v-if="showCapacity" class="mt-auto flex flex-col items-center py-4">
          <NProgress class="custom-progress" indicator-placement="inside" :percentage="20" :height="14" />
          <div class="mt-1 text-sm font-size-10px">9845G/16T</div>
        </div>
      </div>
    </template>
    <div class="h-full flex-col-stretch gap-12px">
      <NCard :bordered="false" size="small" class="h-full flex flex-col overflow-y-auto card-wrapper">
        <!-- 固定的顶部操作栏 -->
        <div class="sticky top-0 z-50 bg-white dark:bg-[#18181c]">
          <NGrid :x-gap="gap" responsive="screen" item-responsive>
            <NGridItem span="24 s:24 m:24 l:24 xl:24">
              <NFlex justify="space-between" class="mt-10px">
                <div class="flex gap-8px">
                  <NDropdown trigger="hover" :options="uploadOptions">
                    <NButton type="primary" round>
                      <template #icon>
                        <icon-ic-outline-file-upload />
                      </template>
                      上传
                    </NButton>
                  </NDropdown>
                  <NDropdown trigger="click" :options="createOptions">
                    <NButton type="primary" round>
                      <template #icon>
                        <icon-material-symbols-add-circle-outline />
                      </template>
                      新建
                    </NButton>
                  </NDropdown>
                  <NInputGroup>
                    <NInput v-model:value="searchKeyword" placeholder="搜索我的文件"></NInput>
                    <NButton type="primary" @click="handleSearch">
                      <template #icon>
                        <icon-uil-search />
                      </template>
                      搜索
                    </NButton>
                  </NInputGroup>
                </div>
                <div class="flex gap-8px">
                  <NButton type="primary">
                    <template #icon>
                      <icon-fluent-multiselect-20-filled />
                    </template>
                    <template #default>{{ isBatchMode ? '取消批量' : '批量操作' }}</template>
                  </NButton>
                  <NButtonGroup>
                    <NTooltip placement="bottom" trigger="hover">
                      <template #trigger>
                        <NButton>
                          <template #icon>
                            <icon-cuida-swap-vertical-arrows-outline />
                          </template>
                        </NButton>
                      </template>
                      <span>传输列表</span>
                    </NTooltip>
                    <NTooltip placement="bottom" trigger="hover">
                      <template #trigger>
                        <NButton>
                          <template #icon>
                            <icon-tabler-filter />
                          </template>
                        </NButton>
                      </template>
                      <span>排序</span>
                    </NTooltip>
                    <NTooltip placement="bottom" trigger="hover">
                      <template #trigger>
                        <NButton @click="toggleMode">
                          <template #icon>
                            <icon-material-symbols-apps v-if="currentMode === 'grid'" />
                            <icon-mdi-format-list-bulleted v-else />
                          </template>
                        </NButton>
                      </template>
                      <span>视图</span>
                    </NTooltip>
                  </NButtonGroup>
                </div>
              </NFlex>
            </NGridItem>
          </NGrid>
          <div class="mt-12px font-size-10px font-bold">全部文件</div>
        </div>
        <!-- 可滚动的内容区域 -->
        <FileDiskplayGrid :is-batch-mode="isBatchMode" :data="fileList" />
      </NCard>
    </div>
  </DiskSider>
</template>

<style scoped lang="scss">
.custom-progress {
  width: 80%; /* 设置进度条宽度 */
  max-width: 200px; /* 限制最大宽度 */
  margin: 0 auto; /* 水平居中 */
  display: block; /* 确保是块级元素 */
}

/* 自定义滚动条样式 */
:deep(.custom-scrollbar) {
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 深色模式滚动条 */
  .dark &::-webkit-scrollbar-track {
    background: #333;
  }

  .dark &::-webkit-scrollbar-thumb {
    background: #666;
  }

  .dark &::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
}
</style>
