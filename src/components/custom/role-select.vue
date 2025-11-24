<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';
import type { SelectProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchGetRoleSelect } from '@/service/api/system/role';

defineOptions({
  name: 'RoleSelect'
});

interface Props {
  multiple?: boolean; // 显式声明 multiple 属性
  [key: string]: any;
}

const props = defineProps<Props>();

const modelValue = defineModel<CommonType.IdType | CommonType.IdType[] | null>('value', { required: false });

const value = computed({
  get() {
    return modelValue.value;
  },
  set(val) {
    modelValue.value = val;
  }
});

const attrs: SelectProps = useAttrs();

const { loading: roleLoading, startLoading: startRoleLoading, endLoading: endRoleLoading } = useLoading();

/** the enabled role options */
const roleOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);

async function getRoleOptions() {
  startRoleLoading();
  const { error, data } = await fetchGetRoleSelect();

  if (!error) {
    roleOptions.value = data.map(item => ({
      label: item.roleName,
      value: item.roleId
    }));
  }
  endRoleLoading();
}

getRoleOptions();
</script>

<template>
  <NSelect
    v-model:value="value"
    :loading="roleLoading"
    :options="roleOptions"
    :multiple="props.multiple"
    v-bind="attrs"
    placeholder="请选择角色"
  />
</template>

<style scoped></style>
