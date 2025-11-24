<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'UserOperateModal'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.User | null;
  /** the dept tree data */
  deptData?: Api.Common.CommonTreeRecord;
  /** the dept id */
  deptId?: CommonType.IdType | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule, patternRules } = useFormRules();

const visible = defineModel<boolean>('visible', {
  default: false
});

function createDefaultModel(): Model {
  return {
    deptId: null,
    userName: '',
    nickName: '',
    userEmail: '',
    userPhone: '',
    gender: 0,
    password: '',
    status: false,
    roleIds: [],
    postIds: [],
    remark: ''
  };
}

type Model = Api.System.UserOperateParams;

const model: Model = reactive(createDefaultModel());

const { loading, startLoading, endLoading } = useLoading();
const { loading: deptLoading, startLoading: startDeptLoading, endLoading: endDeptLoading } = useLoading();

type RuleKey = Extract<keyof Model, 'userName' | 'nickName' | 'password' | 'status' | 'userPhone'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  userName: [createRequiredRule($t('page.system.user.form.userName.required'))],
  nickName: [createRequiredRule($t('page.system.user.form.nickName.required'))],
  password: [{ ...patternRules.pwd, required: props.operateType === 'add' }],
  userPhone: [patternRules.phone],
  status: [createRequiredRule($t('page.system.user.form.status.required'))]
};

const genderOptions = [
  { label: $t('page.system.user.unknown'), value: 0 },
  { label: $t('page.system.user.male'), value: 1 },
  { label: $t('page.system.user.female'), value: 2 }
];

const statusOptions = [
  { label: $t('page.system.user.statusEnabled'), value: true },
  { label: $t('page.system.user.statusDisabled'), value: false }
];

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.system.user.addUser'),
    edit: $t('page.system.user.editUser')
  };
  return titles[props.operateType];
});

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
}

async function getUserInfo() {
  startLoading();
  endLoading();
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    model.deptId = props.deptId;
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    startDeptLoading();
    Object.assign(model, props.rowData);
    model.password = '';
    getUserInfo();
    endDeptLoading();
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NModal v-model:show="visible" display-directive="show" :width="800" class="max-w-40%" preset="card">
    <template #header>
      {{ title }}
    </template>
    <NSpin :show="loading">
      <NForm ref="formRef" :model="model" :rules="rules">
        <NGrid cols="12 xl:24 2xl:24" :x-gap="10" responsive="screen">
          <NFormItemGi :span="12" :label="$t('page.system.user.userName')" path="userName">
            <NInput v-model:value="model.userName" :placeholder="$t('page.system.user.form.userName.required')" />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.nickName')" path="nickName">
            <NInput v-model:value="model.nickName" :placeholder="$t('page.system.user.form.nickName.required')" />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.userPhone')" path="userPhone">
            <NInput v-model:value="model.userPhone" :placeholder="$t('page.system.user.form.userPhone.required')" />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.userEmail')" path="userEmail">
            <NInput v-model:value="model.userEmail" :placeholder="$t('page.system.user.form.userEmail.required')" />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.deptName')" path="deptId">
            <NTreeSelect
              v-model:value="model.deptId"
              :loading="deptLoading"
              clearable
              :options="deptData as []"
              label-field="label"
              key-field="id"
              :default-expanded-keys="deptData?.length ? [deptData[0].id] : []"
              :placeholder="$t('page.system.user.form.deptId.required')"
              @update:value="model.postIds = []"
            />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.postIds')" path="postIds">
            <PostSelect v-model:value="model.postIds" :dept-id="model.deptId" multiple clearable />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.gender')" path="gender">
            <NRadioGroup v-model:value="model.gender">
              <NRadio v-for="item in genderOptions" :key="item.value">
                {{ item.label }}
              </NRadio>
            </NRadioGroup>
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.status')" path="status">
            <NRadioGroup v-model:value="model.status">
              <NRadio v-for="item in statusOptions" :key="item.value.toString()">
                {{ item.label }}
              </NRadio>
            </NRadioGroup>
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.roleIds')" path="roleIds">
            <RoleSelect v-model:value="model.roleIds" multiple clearable />
          </NFormItemGi>
          <NFormItemGi :span="12" :label="$t('page.system.user.remark')" path="remark">
            <NInput
              v-model:value="model.remark"
              type="textarea"
              :placeholder="$t('page.system.user.form.remark.required')"
            />
          </NFormItemGi>
        </NGrid>
      </NForm>
    </NSpin>
    <div>operateType: {{ props.operateType }}</div>
    <template #footer>
      <NSpace :size="16" reverse>
        <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
