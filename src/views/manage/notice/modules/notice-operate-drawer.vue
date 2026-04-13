<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import {
  fetchCreateNotice,
  fetchUpdateNotice,
  fetchGetNoticeDetail
} from '@/service/api/system/notice';
import { fetchGetUserSelect, fetchGetRoleSelect } from '@/service/api/system';
import { fetchGetDeptTree } from '@/service/api/system/user';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import DeptTree from '@/components/custom/dept-tree.vue';

defineOptions({
  name: 'NoticeOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.Notice | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增通知公告',
    edit: '编辑通知公告'
  };
  return titles[props.operateType];
});

interface Model {
  noticeId: CommonType.IdType | null;
  noticeTitle: string;
  noticeType: string;
  noticeContent: string;
  status: string;
  isAll: string;
  userIds: CommonType.IdType[];
  roleIds: CommonType.IdType[];
  deptIds: CommonType.IdType[];
  topFlag: string;
  topEndTime: number | null;
  effectiveTime: number | null;
  expireTime: number | null;
}

const model = ref<Model>(createDefaultModel());

// 用户选择器选项
const userOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);
// 角色选择器选项
const roleOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);
// 部门树数据
const deptOptions = ref<any[]>([]);
// 部门树加载状态
const deptLoading = ref(false);

function createDefaultModel(): Model {
  return {
    noticeId: null,
    noticeTitle: '',
    noticeType: '1',
    noticeContent: '',
    status: '0',
    isAll: '0',
    userIds: [],
    roleIds: [],
    deptIds: [],
    topFlag: '0',
    topEndTime: null,
    effectiveTime: null,
    expireTime: null
  };
}

type RuleKey = Extract<keyof Model, 'noticeTitle' | 'noticeType' | 'noticeContent' | 'status'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  noticeTitle: createRequiredRule('公告标题不能为空'),
  noticeType: createRequiredRule('公告类型不能为空'),
  noticeContent: createRequiredRule('公告内容不能为空'),
  status: createRequiredRule('公告状态不能为空')
};

// 获取用户选择器选项
async function getUserOptions() {
  const { error, data } = await fetchGetUserSelect();
  if (!error) {
    userOptions.value = data.map(user => ({
      label: `${user.nickName} (${user.userName})`,
      value: user.userId
    }));
  }
}

// 获取角色选择器选项
async function getRoleOptions() {
  const { error, data } = await fetchGetRoleSelect();
  if (!error) {
    roleOptions.value = data.map(role => ({
      label: role.roleName,
      value: role.roleId
    }));
  }
}

// 获取部门树数据
async function getDeptTree() {
  deptLoading.value = true;
  const { error, data } = await fetchGetDeptTree();
  if (!error) {
    deptOptions.value = Array.isArray(data) ? data : [data];
  }
  deptLoading.value = false;
}

async function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  startLoading();

  // 加载选择器选项
  await getUserOptions();
  await getRoleOptions();
  await getDeptTree();

  if (props.operateType === 'edit' && props.rowData?.noticeId) {
    // 获取完整的公告详情
    const { error, data } = await fetchGetNoticeDetail(props.rowData.noticeId);
    if (!error) {
      model.value = {
        noticeId: data.noticeId,
        noticeTitle: data.noticeTitle,
        noticeType: data.noticeType,
        noticeContent: data.noticeContent,
        status: data.status,
        isAll: data.isAll || '0',
        userIds: data.userIds || [],
        roleIds: data.roleIds || [],
        deptIds: data.deptIds || [],
        topFlag: data.topFlag || '0',
        topEndTime: data.topEndTime ? new Date(data.topEndTime).getTime() : null,
        effectiveTime: data.effectiveTime ? new Date(data.effectiveTime).getTime() : null,
        expireTime: data.expireTime ? new Date(data.expireTime).getTime() : null
      };
    }
  }

  endLoading();
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { noticeId, noticeTitle, noticeType, noticeContent, status, isAll, userIds, roleIds, deptIds, topFlag, topEndTime, effectiveTime, expireTime } = model.value;

  // 转换时间格式
  const params: Api.System.NoticeOperateParams = {
    noticeId,
    noticeTitle,
    noticeType,
    noticeContent,
    status,
    isAll,
    userIds: isAll === '0' ? userIds : [],
    roleIds: isAll === '0' ? roleIds : [],
    deptIds: isAll === '0' ? deptIds : [],
    topFlag,
    topEndTime: topEndTime ? new Date(topEndTime).toISOString() : undefined,
    effectiveTime: effectiveTime ? new Date(effectiveTime).toISOString() : undefined,
    expireTime: expireTime ? new Date(expireTime).toISOString() : undefined
  };

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateNotice(params);
    if (error) return;
    window.$message?.success($t('common.addSuccess'));
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateNotice(params);
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
  }

  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer
    v-model:show="visible"
    :trap-focus="false"
    :title="title"
    display-directive="show"
    :width="1500"
    class="max-w-90%"
  >
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <div class="grid grid-cols-1 gap-16px md:grid-cols-4">
            <NFormItem class="col-span-2" label="公告标题" path="noticeTitle">
              <NInput v-model:value="model.noticeTitle" placeholder="请输入公告标题" />
            </NFormItem>
            <NFormItem class="col-span-1" label="公告类型" path="noticeType">
              <DictRadio v-model:value="model.noticeType" dict-code="sys_notice_type" />
            </NFormItem>
            <NFormItem class="col-span-1" label="公告状态" path="status">
              <DictRadio v-model:value="model.status" dict-code="sys_normal_disable" />
            </NFormItem>
          </div>

          <!-- 发布范围设置 -->
          <NDivider>发布范围</NDivider>
          <div class="grid grid-cols-1 gap-16px md:grid-cols-4">
            <NFormItem class="col-span-1" label="全员可见">
              <NSwitch
                v-model:value="model.isAll"
                checked-value="1"
                unchecked-value="0"
              >
                <template #checked>是</template>
                <template #unchecked>否</template>
              </NSwitch>
            </NFormItem>
          </div>

          <!-- 当非全员可见时显示范围选择 -->
          <div v-if="model.isAll === '0'" class="grid grid-cols-1 gap-16px">
            <NFormItem label="指定用户">
              <NSelect
                v-model:value="model.userIds"
                :options="userOptions"
                :loading="loading"
                multiple
                clearable
                filterable
                placeholder="请选择用户"
              />
            </NFormItem>
            <NFormItem label="指定角色">
              <NSelect
                v-model:value="model.roleIds"
                :options="roleOptions"
                :loading="loading"
                multiple
                clearable
                placeholder="请选择角色"
              />
            </NFormItem>
            <NFormItem label="指定部门">
              <DeptTree
                v-model:value="model.deptIds"
                v-model:options="deptOptions"
                v-model:loading="deptLoading"
                :immediate="false"
              />
            </NFormItem>
          </div>

          <!-- 时效和置顶设置 -->
          <NDivider>时效与置顶</NDivider>
          <div class="grid grid-cols-1 gap-16px md:grid-cols-3">
            <NFormItem class="col-span-1" label="置顶公告">
              <NSwitch
                v-model:value="model.topFlag"
                checked-value="1"
                unchecked-value="0"
              >
                <template #checked>是</template>
                <template #unchecked>否</template>
              </NSwitch>
            </NFormItem>
            <NFormItem v-if="model.topFlag === '1'" class="col-span-2" label="置顶截止时间">
              <NDatePicker
                v-model:value="model.topEndTime"
                type="datetime"
                clearable
                class="w-full"
              />
            </NFormItem>
          </div>
          <div class="grid grid-cols-1 gap-16px md:grid-cols-2">
            <NFormItem label="生效时间">
              <NDatePicker
                v-model:value="model.effectiveTime"
                type="datetime"
                clearable
                class="w-full"
              />
            </NFormItem>
            <NFormItem label="失效时间">
              <NDatePicker
                v-model:value="model.expireTime"
                type="datetime"
                clearable
                class="w-full"
              />
            </NFormItem>
          </div>

          <!-- 公告内容 -->
          <NDivider>公告内容</NDivider>
          <NFormItem :show-label="false" path="noticeContent">
            <WangEditor v-model:value="model.noticeContent" />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>