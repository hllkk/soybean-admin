<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'OperationSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.System.OperationLogSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

const dateRangeOperTime = ref<[string, string] | null>(null);

/** 操作类型选项（操作日志特有类型） */
const businessTypeOptions = [
  { label: $t('page.system.operationLog.businessTypeOptions.other'), value: 0 },
  { label: $t('page.system.operationLog.businessTypeOptions.insert'), value: 1 },
  { label: $t('page.system.operationLog.businessTypeOptions.update'), value: 2 },
  { label: $t('page.system.operationLog.businessTypeOptions.delete'), value: 3 },
  { label: $t('page.system.operationLog.businessTypeOptions.grant'), value: 4 },
  { label: $t('page.system.operationLog.businessTypeOptions.export'), value: 5 },
  { label: $t('page.system.operationLog.businessTypeOptions.import'), value: 6 },
  { label: $t('page.system.operationLog.businessTypeOptions.force'), value: 7 },
  { label: $t('page.system.operationLog.businessTypeOptions.genCode'), value: 8 },
  { label: $t('page.system.operationLog.businessTypeOptions.clean'), value: 9 }
];

/** 操作状态选项 */
const statusOptions = [
  { label: $t('common.yesOrNo.yes'), value: 0 },
  { label: $t('common.yesOrNo.no'), value: 1 }
];

function onDateRangeOperTimeUpdate(value: [string, string] | null) {
  if (value && value.length === 2) {
    [model.value.beginTime, model.value.endTime] = value;
  } else {
    model.value.beginTime = undefined;
    model.value.endTime = undefined;
  }
}

function resetModel() {
  dateRangeOperTime.value = null;
  Object.assign(model.value, defaultModel);
}

async function reset() {
  await restoreValidation();
  resetModel();
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
      <NCollapseItem :title="$t('common.search')" name="operation-search">
        <NForm ref="formRef" :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.operationLog.title')" path="title" class="pr-24px">
              <NInput v-model:value="model.title" :placeholder="$t('common.pleaseInput')" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.operationLog.operName')" path="operName" class="pr-24px">
              <NInput v-model:value="model.operName" :placeholder="$t('common.pleaseInput')" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.operationLog.operIp')" path="operIp" class="pr-24px">
              <NInput v-model:value="model.operIp" :placeholder="$t('common.pleaseInput')" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.operationLog.businessType')" path="businessType" class="pr-24px">
              <NSelect
                v-model:value="model.businessType"
                :options="businessTypeOptions"
                :placeholder="$t('common.pleaseSelect')"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.operationLog.status')" path="status" class="pr-24px">
              <NSelect
                v-model:value="model.status"
                :options="statusOptions"
                :placeholder="$t('common.pleaseSelect')"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.system.operationLog.operTime')" path="operTime" class="pr-24px">
              <NDatePicker
                v-model:formatted-value="dateRangeOperTime"
                update-value-on-close
                class="w-full"
                type="daterange"
                value-format="yyyy-MM-dd"
                clearable
                @update:formatted-value="onDateRangeOperTimeUpdate"
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