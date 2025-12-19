<script lang="ts" setup>
import VueSimpleUploader from 'vue-simple-uploader';
  // 从插件中提取组件
const { Uploader, UploaderBtn, UploaderDrop, UploaderList, UploaderUnsupport } = VueSimpleUploader;
defineOptions({
  name: 'GlobalUploader'
});
</script>

<template>
  <div class="pos-fixed z-1002 right-15px bottom-15px">
    <Uploader>
      <UploaderUnsupport>您的浏览器不支持上传组件</UploaderUnsupport>
      <!-- 上传区域-->
      <UploaderDrop>
        <span>上传文件到当前目录下</span>
      </UploaderDrop>
      <UploaderBtn id="btn-file">选择文件</UploaderBtn>
      <UploaderBtn id="btn-folder" :directory="true">选择文件夹</UploaderBtn>
    </Uploader>
  </div>
</template>
