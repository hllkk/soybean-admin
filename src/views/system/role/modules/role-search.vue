<script setup lang="ts">
import { ref } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';

defineOptions({
  name: 'RoleSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const dateRangeCreateTime = ref<[string, string] | null>(null);

const model = defineModel<Api.System.RoleSearchParams>('model', { required: true });

const { options: sysNormalDisableOptions } = useDict('sys_normal_disable');

function onDateRangeCreateTimeUpdate(value: [string, string] | null) {
  if (value?.length) {
    model.value.params!.beginTime = `${value[0]} 00:00:00`;
    model.value.params!.endTime = `${value[1]} 23:59:59`;
  }
}

async function reset() {
  dateRangeCreateTime.value = null;
  await restoreValidation();
  emit('reset');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="user-search">
        <NForm ref="formRef" :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.role.roleName')" path="roleName" class="pr-24px">
              <NInput v-model:value="model.roleName" :placeholder="$t('page.system.role.form.roleName.required')" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.role.roleKey')" path="roleKey" class="pr-24px">
              <NInput v-model:value="model.roleKey" :placeholder="$t('page.system.role.form.roleKey.required')" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.role.status')" path="status" class="pr-24px">
              <NSelect
                v-model:value="model.status"
                :placeholder="$t('page.system.role.form.status.required')"
                :options="sysNormalDisableOptions"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi
              span="24 s:12 m:6"
              :label="$t('page.system.role.createTime')"
              path="createTime"
              class="pr-24px"
            >
              <NDatePicker
                v-model:formatted-value="dateRangeCreateTime"
                update-value-on-close
                class="w-full"
                type="daterange"
                value-format="yyyy-MM-dd"
                clearable
                @update:formatted-value="onDateRangeCreateTimeUpdate"
              />
            </NFormItemGi>
            <NFormItemGi span="24" class="pr-24px">
              <NSpace class="w-full" justify="end">
                <NButton @click="reset">
                  <template #icon>
                    <icon-ic-round-refresh class="text-icon" />
                  </template>
                  {{ $t('common.reset') }}
                </NButton>
                <NButton type="primary" ghost @click="search">
                  <template #icon>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                  {{ $t('common.search') }}
                </NButton>
              </NSpace>
            </NFormItemGi>
          </NGrid>
        </NForm>
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>

<style scoped></style>
