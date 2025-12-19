declare module 'vue-simple-uploader' {
  import { DefineComponent, App } from 'vue';

  interface UploaderProps {
    autoStart?: boolean;
  }

  interface UploaderBtnProps {
    attrs?: Record<string, any>; // 官方介绍 attrs 是Object，添加到input元素上的额外属性
    single?: boolean; // 默认 false, 如果设为 true，则代表一次只能选择一个文件。
    directory?: boolean; // 默认 false, 是否是文件夹上传。
  }
  // export const Uploader: Component<UploaderProps>;
  // 定义组件类型
  export const Uploader: DefineComponent<UploaderProps>;
  export const UploaderBtn: DefineComponent<UploaderBtnProps>;
  export const UploaderDrop: DefineComponent;
  export const UploaderList: DefineComponent;
  export const UploaderUnsupport: DefineComponent;
  export const UploaderFile: DefineComponent;

  // 插件类型
  interface VueSimpleUploaderPlugin {
    install: (app: App) => void;
    Uploader: typeof Uploader;
    UploaderBtn: typeof UploaderBtn;
    UploaderDrop: typeof UploaderDrop;
    UploaderList: typeof UploaderList;
    UploaderUnsupport: typeof UploaderUnsupport;
    UploaderFile: typeof UploaderFile;
  }
  const VueSimpleUploader: VueSimpleUploaderPlugin;
  export default VueSimpleUploader;
}

