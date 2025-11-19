<script lang="tsx" setup>
import { computed, ref } from 'vue';
import type { DataTableColumns, TreeInst, TreeOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { menuTypeRecord } from '@/constants/common';
import { fetchGetMenuBtnList, fetchGetMenuList } from '@/service/api/system/menu';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { handleTree } from '@/utils/common';
import { $t } from '@/locales';

const defaultIcon = import.meta.env.VITE_MENU_ICON;
let controller = new AbortController();

const { loading, startLoading, endLoading } = useLoading();
const { loading: btnLoading, startLoading: startBtnLoading, endLoading: endBtnLoading } = useLoading();
const { hasAuth } = useAuth();
const appStore = useAppStore();

const menuTreeRef = ref<TreeInst>();
const name = ref<string>();
const activeTab = ref<string>('admin');
const checkedKeys = ref<CommonType.IdType[]>([0]);
const expandedKeys = ref<CommonType.IdType[]>([0]);
const currentMenu = ref<Api.System.Menu>();
const btnData = ref<Api.System.MenuButtonList>([]);
const treeDataMap = ref<Record<string, Api.System.Menu[]>>({
  admin: [],
  disk: []
});
const tabItems = computed(() => {
  return [
    {
      name: 'admin',
      label: $t('page.system.menu.adminManage')
    },
    {
      name: 'disk',
      label: $t('page.system.menu.diskManage')
    }
  ];
});

const getMeunTree = async () => {
  // if (treeDataMap.value[activeTab.value].length > 0) return;
  startLoading();
  const { data, error } = await fetchGetMenuList();
  if (error) return;
  treeDataMap.value[activeTab.value] = [
    {
      menuId: 0,
      menuName: $t('page.system.menu.rootName'),
      icon: 'material-symbols-home-outline-rounded',
      children: handleTree(data, { idField: 'menuId', filterFn: item => item.module === activeTab.value })
    }
  ] as Api.System.Menu[];

  endLoading();
};

function handleAddMenu(pid: CommonType.IdType) {
  window.$message?.info(`${pid}`);
}

function handleUpdateMenu() {
  window.$message?.info(`${currentMenu.value?.menuId}`);
}

function handleDeleteMenu() {
  window.$message?.info(`${currentMenu.value?.menuId}`);
}

async function getBtnMenuList() {
  if (!currentMenu.value?.menuId) {
    return;
  }
  controller.abort();
  controller = new AbortController();
  startBtnLoading();
  btnData.value = [];
  const { data, error } = await fetchGetMenuBtnList(currentMenu.value?.menuId, controller.signal);
  if (error) return;
  btnData.value = data || [];
  endBtnLoading();
}

function renderLabel({ option }: { option: TreeOption }) {
  // 如果i18nKey存在则取i18nKey的值，否则取menuName的值
  let label = '';
  if (option.i18nKey) {
    label = $t(option.i18nKey as App.I18n.I18nKey);
  } else {
    label = String(option.menuName);
  }
  return <div>{label}</div>;
}

function renderPrefix({ option }: { option: TreeOption }) {
  const renderLocalIcon = String(option.icon).startsWith('local-icon-');
  const icon = renderLocalIcon ? undefined : String(option.icon);
  const localIcon = renderLocalIcon ? String(option.icon).replace('local-icon-', 'menu-') : undefined;
  return <SvgIcon icon={icon || defaultIcon} localIcon={localIcon} />;
}

function renderSuffix({ option }: { option: TreeOption }) {
  if (!['M'].includes(String(option.menuType)) || !hasAuth('system:menu:add')) {
    return null;
  }

  return (
    <div class="flex-center gap-8px">
      <ButtonIcon
        text
        class="h-18px"
        icon="ic-round-plus"
        tooltip-content={$t('page.system.menu.addChildMenu')}
        onClick={(event: Event) => {
          event.stopPropagation();
          handleAddMenu(option.menuId as CommonType.IdType);
        }}
      />
    </div>
  );
}

function addBtnMenu() {}

function handleUpdateBtnMenu(row: Api.System.MenuButton) {
  window.$message?.info(`${row.buttonId}`);
}

function handleDeleteBtnMenu(buttonId: CommonType.IdType) {
  window.$message?.info(`${buttonId}`);
}

const btnColumns: DataTableColumns<Api.System.MenuButton> = [
  {
    key: 'index',
    width: 64,
    align: 'center',
    title() {
      return (
        <NButton circle type="primary" size="small" onClick={() => addBtnMenu()}>
          {{
            icon: () => (
              <NIcon>
                <SvgIcon icon="ic-round-plus" />
              </NIcon>
            )
          }}
        </NButton>
      );
    },
    render(_, index) {
      return index + 1;
    }
  },
  {
    title: $t('page.system.menu.buttonName'),
    key: 'buttonName',
    minWidth: 120
  },
  {
    title: $t('page.system.menu.buttonCode'),
    key: 'buttonCode',
    align: 'center',
    minWidth: 120
  },
  {
    title: $t('page.system.menu.status'),
    key: 'status',
    minWidth: 80,
    align: 'center',
    render(row) {
      return <NTag size="small">{row.status}</NTag>;
    }
  },
  {
    title: $t('page.system.menu.createTime'),
    key: 'createTime',
    align: 'center',
    minWidth: 150
  },
  {
    title: $t('common.action'),
    key: 'actions',
    width: 80,
    align: 'center',
    render(row) {
      const divider = () => {
        if (!hasAuth('system:menu:edit') || !hasAuth('system:menu:remove')) {
          return null;
        }
        return <NDivider vertical />;
      };

      const editBtn = () => {
        if (!hasAuth('system:menu:edit')) {
          return null;
        }
        return (
          <ButtonIcon
            text
            type="primary"
            icon="material-symbols:drive-file-rename-outline-outline"
            tooltipContent={$t('common.edit')}
            onClick={() => handleUpdateBtnMenu(row)}
          />
        );
      };

      const deleteBtn = () => {
        if (!hasAuth('system:menu:remove')) {
          return null;
        }
        return (
          <ButtonIcon
            text
            type="error"
            icon="material-symbols:delete-outline"
            tooltipContent={$t('common.delete')}
            popconfirmContent={$t('common.confirmDelete')}
            onPositiveClick={() => handleDeleteBtnMenu(row.buttonId!)}
          />
        );
      };

      return (
        <div class="flex-center gap-8px">
          {editBtn()}
          {divider()}
          {deleteBtn()}
        </div>
      );
    }
  }
];

function handleTabChange(tab: string) {
  activeTab.value = tab;
  getMeunTree();
}
</script>

<template>
  <TableSiderLayout default-expanded>
    <template #header>{{ $t('page.system.menu.title') }}</template>
    <template #header-extra>
      <ButtonIcon
        size="small"
        icon="material-symbols-add-rounded"
        class="h-28px text-icon color-primary"
        :tooltip-content="$t('page.system.menu.addMenu')"
      />
      <ButtonIcon
        size="small"
        icon="material-symbols:delete-outline"
        class="h-28px text-icon color-error"
        :tooltip-content="$t('page.system.menu.cascadeDelete')"
      />
      <ButtonIcon
        size="small"
        icon="material-symbols:refresh-rounded"
        class="h-28px text-icon"
        :tooltip-content="$t('common.refresh')"
      />
    </template>
    <template #sider>
      <div class="flex gap-6px">
        <NInput v-model:value="name" size="small" :placeholder="$t('page.system.menu.form.menuName.required')" />
      </div>
      <NTabs
        v-model:value="activeTab"
        type="line"
        justify-content="space-evenly"
        animated
        class="select-none"
        @update:value="handleTabChange"
      >
        <NTabPane v-for="item in tabItems" :key="item.name" :name="item.name" :tab="item.label">
          <NSpin
            :show="loading"
            class="h-[calc(85vh-224px-var(--calc-footer-height,0px))] flex items-center justify-center overflow-hidden"
          >
            <NTree
              ref="menuTreeRef"
              v-model:checked-keys="checkedKeys"
              v-model:expanded-keys="expandedKeys"
              :cancelable="false"
              block-node
              show-line
              :data="treeDataMap[activeTab]"
              :default-expanded-keys="[0]"
              :show-irrelevant-nodes="false"
              :pattern="name"
              class="h-full min-h-200px py-3"
              key-field="menuId"
              label-field="menuName"
              virtual-scroll
              checkable
              :render-label="renderLabel"
              :render-prefix="renderPrefix"
              :render-suffix="renderSuffix"
            >
              <template #empty>
                <NEmpty :description="$t('page.system.menu.empty')" class="h-full min-h-200px justify-center" />
              </template>
            </NTree>
          </NSpin>
        </NTabPane>
      </NTabs>
    </template>
    <div class="h-full flex-col-stretch gap-16px">
      <template v-if="currentMenu">
        <NCard
          :title="$t('page.system.menu.menuDetail')"
          :bordered="false"
          size="small"
          class="max-h-50% card-wrapper"
          content-class="overflow-auto mb-12px"
        >
          <template #header-extra>
            <NSpace>
              <NButton size="small" ghost type="primary" @click="handleAddMenu(currentMenu.menuId!)">
                <template #icon>
                  <icon-material-symbols-add-rounded />
                </template>
                {{ $t('page.system.menu.addChildMenu') }}
              </NButton>
              <NButton size="small" ghost type="primary" @click="handleUpdateMenu">
                <template #icon>
                  <icon-material-symbols-drive-file-rename-outline-outline />
                </template>
                {{ $t('common.edit') }}
              </NButton>
              <NPopconfirm @positive-click="() => handleDeleteMenu()">
                <template #trigger>
                  <NButton size="small" ghost type="error" :disabled="btnData.length > 0 || btnLoading">
                    <template #icon>
                      <icon-material-symbols-delete-outline />
                    </template>
                    {{ $t('common.delete') }}
                  </NButton>
                </template>
                {{ $t('common.confirmDelete') }}
              </NPopconfirm>
            </NSpace>
          </template>
          <NDescriptions
            label-placement="left"
            size="small"
            bordered
            :column="appStore.isMobile ? 1 : 2"
            label-class="w-20% min-w-88px"
            content-class="w-100px"
          >
            <NDescriptionsItem :label="$t('page.system.menu.menuType')">
              <NTag class="m-1" size="small" type="primary">{{ menuTypeRecord[currentMenu.menuType!] }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.system.menu.status')">
              <NTag class="m-1" size="small" type="primary">{{ currentMenu.status }}</NTag>
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
        <NCard
          :title="$t('page.system.menu.buttonPermissionList')"
          :bordered="false"
          size="small"
          class="h-full overflow-auto card-wrapper"
          content-class="overflow-auto mb-12px"
        >
          <template #header-extra>
            <ButtonIcon
              size="small"
              icon="ic-round-refresh"
              class="h-28px text-icon"
              :tooltip-content="$t('common.refresh')"
              @click.stop="getBtnMenuList"
            />
          </template>
          <NDataTable class="h-full" :loading="btnLoading" :columns="btnColumns" :data="btnData" />
        </NCard>
      </template>
    </div>
  </TableSiderLayout>
</template>

<style scoped lang="scss"></style>
