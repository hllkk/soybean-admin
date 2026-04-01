<script setup lang="tsx">
import { onMounted, reactive, ref, watch, useAttrs } from 'vue';
import type { TreeOption, TreeSelectInst, TreeSelectProps } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetMenuTreeSelect } from '@/service/api/system';
import { fetchGetAppList } from '@/service/api/system/app';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { $t } from '@/locales';

defineOptions({ name: 'MenuTree' });

interface Props {
  immediate?: boolean;
  showHeader?: boolean;
  showModuleTabs?: boolean;
  [key: string]: any;
}

const props = withDefaults(defineProps<Props>(), {
  immediate: true,
  showHeader: true,
  showModuleTabs: false
});

const { bool: expandAll } = useBoolean();
const { bool: checkAll } = useBoolean();
const expandedKeys = ref<CommonType.IdType[]>([0]);

const menuTreeRef = ref<TreeSelectInst | null>(null);
const checkedKeys = defineModel<CommonType.IdType[]>('checkedKeys', { required: false, default: [] });
const options = defineModel<Api.System.MenuList>('options', { required: false, default: [] });
const cascade = defineModel<boolean>('cascade', { required: false, default: true });
const loading = defineModel<boolean>('loading', { required: false, default: false });
const attrs: TreeSelectProps = useAttrs();

// 模块相关状态
const appList = ref<Api.System.AppList>([]);
const activeModule = ref<string>('');
const moduleMenuOptions = reactive<Record<string, Api.System.MenuList>>({});
const moduleCheckedKeys = reactive<Record<string, CommonType.IdType[]>>({});
const moduleLoading = reactive<Record<string, boolean>>({});

async function getMenuList() {
  loading.value = true;
  const { error, data } = await fetchGetMenuTreeSelect();
  if (error) return;
  options.value = [
    {
      id: 0,
      label: '根目录',
      icon: 'material-symbols:home-outline-rounded',
      children: data
    }
  ] as Api.System.MenuList;
  // 折叠到只显示根节点
  loading.value = false;
}

async function getAppList() {
  const { data, error } = await fetchGetAppList();
  if (error) return;
  appList.value = data;
  if (appList.value.length > 0) {
    activeModule.value = appList.value[0].appCode;
  }
}

async function getModuleMenuList(module: string) {
  moduleLoading[module] = true;
  const { error, data } = await fetchGetMenuTreeSelect(module);
  if (error) {
    moduleLoading[module] = false;
    return;
  }
  moduleMenuOptions[module] = [
    {
      id: 0,
      label: '根目录',
      icon: 'material-symbols:home-outline-rounded',
      children: data
    }
  ] as Api.System.MenuList;
  moduleLoading[module] = false;
}

async function loadAllModules() {
  await getAppList();
  if (appList.value.length > 0) {
    await Promise.all(appList.value.map(app => getModuleMenuList(app.appCode)));
  }
}

function mergeAllCheckedKeys() {
  const allKeys: CommonType.IdType[] = [];
  for (const module of appList.value) {
    const keys = moduleCheckedKeys[module.appCode] || [];
    allKeys.push(...keys);
  }
  checkedKeys.value = [...new Set(allKeys)];
}

watch(moduleCheckedKeys, () => {
  mergeAllCheckedKeys();
}, { deep: true });

onMounted(() => {
  if (props.immediate) {
    if (props.showModuleTabs) {
      loadAllModules();
    } else {
      getMenuList();
    }
  }
});

watch([expandAll, options], ([newVal]) => {
  if (newVal) {
    // 展开所有节点
    expandedKeys.value = getAllMenuIds(options.value);
  } else {
    expandedKeys.value = [0];
  }
});

// 监听 activeModule 变化，更新展开状态
watch(activeModule, () => {
  expandedKeys.value = [0];
  expandAll.value = false;
});

function renderLabel({ option }: { option: TreeOption }) {
  let label = option.label;
  if (label?.startsWith('route.') || label?.startsWith('menu.')) {
    label = $t(label as App.I18n.I18nKey);
  }
  // 禁用的菜单显示红色
  if (option.status === '1') {
    return (
      <div class="flex items-center gap-4px text-error-200">
        {label}
        <SvgIcon icon="ri:prohibited-line" class="text-16px" />
      </div>
    );
  }
  // 隐藏的菜单显示灰色
  if (option.visible === '1') {
    return (
      <div class="flex items-center gap-4px text-gray-400">
        {label}
        <SvgIcon icon="codex:hidden" class="text-21px" />
      </div>
    );
  }
  return <div>{label}</div>;
}

function renderPrefix({ option }: { option: TreeOption }) {
  const renderLocalIcon = String(option.icon).startsWith('local-icon-');
  let icon = renderLocalIcon ? undefined : String(option.icon ?? 'material-symbols:buttons-alt-outline-rounded');
  const localIcon = renderLocalIcon ? String(option.icon).replace('local-icon-', 'menu-') : undefined;
  if (icon === '#') {
    icon = 'material-symbols:buttons-alt-outline-rounded';
  }
  return <SvgIcon icon={icon} localIcon={localIcon} />;
}

function getAllMenuIds(menu: Api.System.MenuList) {
  const menuIds: CommonType.IdType[] = [];
  menu.forEach(item => {
    menuIds.push(item.id!);
    if (item.children) {
      menuIds.push(...getAllMenuIds(item.children));
    }
  });
  return menuIds;
}

/** 获取所有叶子节点的 ID（没有子节点的节点） */
function getLeafMenuIds(menu: Api.System.MenuList): CommonType.IdType[] {
  const leafIds: CommonType.IdType[] = [];
  menu.forEach(item => {
    if (!item.children || item.children.length === 0) {
      // 是叶子节点
      leafIds.push(item.id!);
    } else {
      // 有子节点，递归获取子节点中的叶子节点
      leafIds.push(...getLeafMenuIds(item.children));
    }
  });
  return leafIds;
}

function handleCheckedTreeNodeAll(checked: boolean) {
  if (props.showModuleTabs) {
    // 模块模式下，仅作用于当前激活模块
    if (checked) {
      moduleCheckedKeys[activeModule.value] = getAllMenuIds(moduleMenuOptions[activeModule.value] || []);
      return;
    }
    moduleCheckedKeys[activeModule.value] = [];
    return;
  }
  if (checked) {
    checkedKeys.value = getAllMenuIds(options.value);
    return;
  }
  checkedKeys.value = [];
}

function getCheckedMenuIds(isCascade: boolean = false) {
  if (props.showModuleTabs) {
    const allIds: string[] = [];
    for (const module of appList.value) {
      const keys = moduleCheckedKeys[module.appCode] || [];
      allIds.push(...keys.map(String));
    }
    return allIds;
  }
  const menuIds = menuTreeRef.value?.getCheckedData()?.keys as string[];
  const indeterminateData = menuTreeRef.value?.getIndeterminateData();
  if (cascade.value || isCascade) {
    const parentIds: string[] = indeterminateData?.keys.filter(item => !menuIds?.includes(String(item))) as string[];
    menuIds?.push(...parentIds);
  }
  return menuIds;
}

function setCheckedKeysByModule(module: string, keys: CommonType.IdType[]) {
  moduleCheckedKeys[module] = keys;
}

function clearAllCheckedKeys() {
  for (const module of appList.value) {
    moduleCheckedKeys[module.appCode] = [];
  }
  checkedKeys.value = [];
}

async function refresh() {
  if (props.showModuleTabs) {
    await loadAllModules();
    return;
  }
  await getMenuList();
}

watch(cascade, () => {
  if (props.showModuleTabs) {
    // 模块模式下，处理当前激活模块的父子联动
    if (cascade.value) {
      const allLeafIds = getLeafMenuIds(moduleMenuOptions[activeModule.value] || []);
      const selectedLeafIds = (moduleCheckedKeys[activeModule.value] || []).filter(id => allLeafIds.includes(id));
      moduleCheckedKeys[activeModule.value] = selectedLeafIds;
    }
    return;
  }
  if (cascade.value) {
    // 获取当前菜单树中的所有叶子节点ID
    const allLeafIds = getLeafMenuIds(options.value);
    // 筛选出当前选中项中的叶子节点
    const selectedLeafIds = checkedKeys.value.filter(id => allLeafIds.includes(id));
    // 重新设置选中状态为只包含叶子节点，让组件基于父子联动规则重新计算父节点状态
    checkedKeys.value = selectedLeafIds;
    return;
  }
  // 禁用父子联动时，将半选中的父节点也加入到选中列表
  checkedKeys.value = getCheckedMenuIds(true);
});

defineExpose({
  getCheckedMenuIds,
  refresh,
  setCheckedKeysByModule,
  clearAllCheckedKeys,
  getAppList,
  getModuleMenuList,
  get appList() { return appList.value; }
});
</script>

<template>
  <div class="w-full flex-col gap-12px">
    <!-- 模块 Tabs 模式 -->
    <NTabs v-if="showModuleTabs" v-model:value="activeModule" type="line">
      <NTabPane v-for="app in appList" :key="app.appCode" :name="app.appCode" :tab="$t(`modules.${app.appCode}`)">
        <!-- 操作栏 -->
        <div v-if="showHeader" class="w-full flex-center mb-12px">
          <NCheckbox v-model:checked="expandAll" :checked-value="true" :unchecked-value="false">展开/折叠</NCheckbox>
          <NCheckbox
            v-model:checked="checkAll"
            :checked-value="true"
            :unchecked-value="false"
            @update:checked="handleCheckedTreeNodeAll"
          >
            全选/反选
          </NCheckbox>
          <NCheckbox v-model:checked="cascade" :checked-value="true" :unchecked-value="false">父子联动</NCheckbox>
        </div>
        <!-- 菜单树 -->
        <NSpin class="resource h-full w-full py-6px pl-3px" content-class="h-full" :show="moduleLoading[app.appCode]">
          <NTree
            ref="menuTreeRef"
            v-model:checked-keys="moduleCheckedKeys[app.appCode]"
            v-model:expanded-keys="expandedKeys"
            multiple
            checkable
            :selectable="false"
            key-field="id"
            label-field="label"
            :data="moduleMenuOptions[app.appCode] || []"
            :cascade="cascade"
            :loading="moduleLoading[app.appCode]"
            virtual-scroll
            check-strategy="all"
            :render-label="renderLabel"
            :render-prefix="renderPrefix"
            v-bind="attrs"
          />
        </NSpin>
      </NTabPane>
    </NTabs>

    <!-- 原有单模块模式 -->
    <template v-else>
      <div v-if="showHeader" class="w-full flex-center">
        <NCheckbox v-model:checked="expandAll" :checked-value="true" :unchecked-value="false">展开/折叠</NCheckbox>
        <NCheckbox
          v-model:checked="checkAll"
          :checked-value="true"
          :unchecked-value="false"
          @update:checked="handleCheckedTreeNodeAll"
        >
          全选/反选
        </NCheckbox>
        <NCheckbox v-model:checked="cascade" :checked-value="true" :unchecked-value="false">父子联动</NCheckbox>
      </div>
      <NSpin class="resource h-full w-full py-6px pl-3px" content-class="h-full" :show="loading">
        <NTree
          ref="menuTreeRef"
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          multiple
          checkable
          :selectable="false"
          key-field="id"
          label-field="label"
          :data="options"
          :cascade="cascade"
          :loading="loading"
          virtual-scroll
          check-strategy="all"
          :render-label="renderLabel"
          :render-prefix="renderPrefix"
          v-bind="attrs"
        />
      </NSpin>
    </template>
  </div>
</template>

<style scoped lang="scss">
.resource {
  border-radius: 6px;
  border: 1px solid rgb(224, 224, 230);

  .n-tree {
    min-height: 200px;
    max-height: 300px;
    width: 100%;
    height: 100%;

    :deep(.n-tree__empty) {
      min-height: 200px;
      justify-content: center;
    }
  }

  .n-empty {
    justify-content: center;
  }
}
</style>