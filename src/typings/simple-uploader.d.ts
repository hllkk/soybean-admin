declare module 'vue-simple-uploader' {
  import type { App, DefineComponent } from 'vue';

  export interface UploaderOptions {
    // 目标上传 URL，可以是字符串也可以是函数，如果是函数的话，则会传入 Uploader.File 实例、当前块 Uploader.Chunk 以及是否是测试模式，默认值为 '/'
    target: string | ((file: any, chunk: any, isTest: boolean) => string);
    // 单文件上传。覆盖式，如果选择了多个会把之前的取消掉。默认 false
    singleFile?: boolean;
    // 分块时按照该值来分。最后一个上传块的大小是可能是大于等于1倍的这个值但是小于两倍的这个值大小，默认 1*1024*1024
    chunkSize?: number;
    // 是否强制所有的块都是小于等于 chunkSize 的值。默认是 false
    forceChunkSize?: boolean;
    // 并发上传数，默认 3
    simultaneousUploads?: number;
    // 上传文件时文件的参数名，默认 file
    fileParameterName?: string;
    // 其他额外的参数，这个可以是一个对象或者是一个函数，如果是函数的话，则会传入 Uploader.File 实例、当前块 Uploader.Chunk 以及是否是测试模式，默认为 {}
    query?: Record<string, any> | ((file: any, chunk: any, isTest: boolean) => Record<string, any>);
    // 额外的一些请求头，可以是对象或者函数，如果是函数的话，则会传入 Uploader.File 实例、当前块 Uploader.Chunk 以及是否是测试模式，默认 {}
    headers?: Record<string, string> | ((file: any, chunk: any, isTest: boolean) => Record<string, string>);
    // 标准的 CORS 请求是不会带上 cookie 的，如果想要带的话需要设置 withCredentials 为 true，默认 false
    withCredentials?: boolean;
    // 当上传的时候所使用的是方式，可选 multipart、octet，默认 multipart
    method?: UnionKey.UploadMethod;
    // 测试的时候使用的 HTTP 方法，可以是字符串或者函数，默认 GET
    testMethod?: string | ((file: any, chunk: any) => string);
    // 真正上传的时候使用的 HTTP 方法，可以是字符串或者函数，默认 POST
    uploadMethod?: string | ((file: any, chunk: any) => string);
    // 如果说一个文件已经上传过了是否还允许再次上传。默认的话如果已经上传了，除非你移除了否则是不会再次重新上传的，所以也就是默认值为 false
    allowDuplicateUploads?: boolean;
    // 对于文件而言是否高优先级发送第一个和最后一个块。一般用来发送到服务端，然后判断是否是合法文件；例如图片或者视频的 meta 数据一般放在文件第一部分，这样可以根据第一个块就能知道是否支持；默认 false
    prioritizeFirstAndLastChunk?: boolean;
    // 是否测试每个块是否在服务端已经上传了，主要用来实现秒传、跨浏览器上传等，默认 true
    testChunks?: boolean;
    // 最大自动失败重试上传次数，值可以是任意正整数，如果是 undefined 则代表无限次，默认 0
    maxChunkRetries?: number | undefined;
    // 重试间隔，值可以是任意正整数，如果是 null 则代表立即重试，默认 null
    chunkRetryInterval?: number | null;
    // 进度回调间隔，默认是 500
    progressCallbacksInterval?: number;
    // 主要用于计算平均速度，值就是从 0 到 1，如果是 1 那么上传的平均速度就等于当前上传速度，如果说长时间上传的话，建议设置为 0.02，这样剩余时间预估会更精确，这个参数是需要和 progressCallbacksInterval 一起调整的，默认是 0.1
    speedSmoothingFactor?: number;
    // 成功状态码列表，默认 [200, 201, 202]
    successStatuses?: (number | string)[];
    // 认为是出错的响应码，默认 [404, 415, 500, 501]
    permanentErrors?: (number | string)[];
    // 初始文件 paused 状态，默认 false
    initialPaused?: boolean;
    // 处理请求结果，默认 function (response, cb) { cb(null, response) }。 0.5.2版本后，processResponse 会传入更多参数
    processResponse?: (response: any, cb: (error: any, data: any) => void, file: any, chunk: any) => void;
    // 可选的函数，每个块在测试以及上传前会被调用，参数就是当前上传块实例 UploaderChunk，注意在这个函数中你需要调用当前上传块实例的 preprocessFinished 方法，默认 null
    preprocess?: (chunk: any) => void;
    // 可选函数用于初始化文件对象，传入的参数就是 Uploader.File 实例
    initFileFn?: (file: any) => void;
    // 可选的函数用于原始文件的读取操作
    readFileFn?: (file: any, type: string, startByte: number, endByte: number, chunk: any) => void;
    // 可选的函数用于根据 XHR 响应内容检测每个块是否上传成功了，传入的参数是：UploaderChunk 实例以及请求响应信息
    checkChunkUploadedByResponse?: (chunk: any, message: string) => boolean;
    // 可覆盖默认的生成文件唯一标示的函数，默认 null
    generateUniqueIdentifier?: (file: any) => string;
    // 处理请求参数，默认 function (params) {return params}，一般用于修改参数名字或者删除参数。0.5.2版本后，processParams 会有更多参数
    processParams?: (params: Record<string, any>, file: any, chunk: any, isTest: boolean) => Record<string, any>;
    // 解析剩余时间函数，用于显示上传剩余时间
    parseTimeRemaining?: (timeRemaining: number, parsedTimeRemaining: string) => string;
    // 文件路径，用于文件夹上传
    // path?: string;
  }

  export interface UploaderProps {
    options?: UploaderOptions;
    autoStart?: boolean;
    fileStatusText?: Record<SimpleUploader.Uploader.FileStatusText, string>;
  }

  export interface UploaderEmits {
    // (e: 'file-added', file: SimpleUploader.Uploader.File): void;
    (e: 'files-added', files: SimpleUploader.Uploader.File[]): void;
    // (e: 'file-removed', file: SimpleUploader.Uploader.File): void;
    // (e: 'files-submitted', files: SimpleUploader.Uploader.File[], fileList: SimpleUploader.Uploader.File[]): void;
    // (e: 'dragenter', event: DragEvent): void;
    // (e: 'dragleave', event: DragEvent): void;
    // (e: 'drop', event: DragEvent): void;
  }

  interface UploaderBtnProps {
    // 添加到input元素上的额外属性
    attrs?: Record<string, any>;
    // 如果设为 true，则代表一次只能选择一个文件，默认 false
    single?: boolean;
    // 是否是文件夹上传，默认 false
    directory?: boolean;
  }

  // 组件实例类型
  export interface UploaderInst {
    allEvents?: Record<string, (event: any) => void>;
    options: UploaderOptions;
    autoStart: boolean;
    fileStatusText: Record<string, string>;
    uploader: SimpleUploader.Uploader.Core;
    started: boolean;
    files: SimpleUploader.Uploader.File[];
    fileList: SimpleUploader.Uploader.File[];
    cancel: () => void;
  }

  export interface UploaderListProps {
    fileList: SimpleUploader.Uploader.File[];
  }

  // 定义组件类型
  export const Uploader: DefineComponent<UploaderProps, UploaderInst, UploaderEmits>;
  export const UploaderBtn: DefineComponent<UploaderBtnProps>;
  export const UploaderDrop: DefineComponent;
  export const UploaderList: DefineComponent;
  export const UploaderUnsupport: DefineComponent;
  export const UploaderFile: DefineComponent<{ file: SimpleUploader.Uploader.File }>;

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

declare namespace SimpleUploader {
  namespace Uploader {
    type FileStatusText = 'success' | 'error' | 'uploading' | 'paused' | 'waiting';

    interface File {
      aborted: boolean;
      allError: boolean;
      averageSpeed: number;
      completed: boolean;
      currentSpeed: number;
      error: boolean;
      fileType: string;
      id: number;
      isFolder: boolean;
      isRoot: boolean;
      name: string;
      paused: boolean;
      relativePath: string;
      size: number;
      uniqueIdentifier: string;
      chunks: Chunk[];
    }

    interface Chunk {
      chunkSize: number;
      endByte: number;
      loaded: number;
      offset: number;
      pendingRetry: boolean;
      preprocessState: number;
      readyState: number;
      retries: number;
      startByte: number;
      tested: boolean;
      total: number;
      xhr: XMLHttpRequest | null;
      bytes: ArrayBuffer | null;
    }

    interface Core {
      id: number;
      aborted: boolean;
      allError: boolean;
      averageSpeed: number;
      completed: boolean;
      currentSpeed: number;
      error: boolean;
      fileStatusText: Record<FileStatusText, string>;
      isFolder: boolean;
      isRoot: boolean;
      opts: import('vue-simple-uploader').UploaderOptions;
      paused: boolean;
      support: boolean;
      supportDirectory: boolean;
      chunks: Chunk[];
      file: File;
      filePaths: Record<string, string>;

      // _eventData: EventData;
      // 方法
      addFile(file: File): void;
      addFiles(files: FileList): void;
      pause(): void;
      resume(): void;
      cancel(): void;
    }

    interface FileAddParams {
      currentDirectory?: string;
      username?: string;
      userId?: CommonType.IdType;
      folder?: import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[];
      lastModified?: number;
      publicApi?: boolean;
      fileId?: string;
    }

    // interface EventData {
    // catchAll: Array<(event: any) => void | null>;
    // fileAdded: Array<(file: File) => void | null>;
    // filesAdded: Array<(files: File[]) => void | null>;
    // fileRemoved: Array<(file: File) => void | null>;
    // filesSubmitted: Array<(files: File[], fileList: File[]) => void | null>;
    // dragenter: Array<(event: DragEvent) => void | null>;
    // dragleave: Array<(event: DragEvent) => void | null>;
    // drop: Array<(event: DragEvent) => void | null>;
    // }
  }
}
