declare namespace Api {
  namespace Disk {
    type MusicInfo = {
      /** 音乐标题 */
      songName?: string;
      /** 音乐艺术家 */
      singer?: string;
      /** 音乐专辑 */
      album?: string;
      /** 音乐时长 */
      duration?: number;
    };

    type VideoInfo = {
      /** 视频宽度 */
      width?: number;
      /** 视频高度 */
      height?: number;
      /** 视频码率 */
      bitrate?: string;
      /** 视频码率数值 */
      bitrateNum?: number | null;
      /** 视频格式 */
      format?: string;
      /** 视频帧率 */
      frameRate?: number;
      /** 视频时长 */
      duration?: number;
    };

    interface FileItem {
      /** 文件唯一ID */
      id: string;
      /** 文件名称 */
      name: string;
      /** 文件大小 */
      size: number;
      /** 访问路径 */
      src?: string;
      /** 拓展名 */
      extendName: string;
      /** 文件更新时间 */
      updateTime: string;
      /** 文件创建时间 */
      createTime?: string;
      /** 是否是文件夹 */
      isDir: boolean;
      /** 文件或文件夹路径 */
      filePath?: string;
      /** 文件或文件夹所有者 */
      userId?: CommonType.IdType;
      /** 是否收藏 */
      isFavorite?: boolean;
      /** 是否分享 */
      isShare?: boolean;
      /** 文件的类型 */
      contentType?: string;
      /** 音乐信息 */
      music?: MusicInfo;
      /** 视频信息 */
      video?: VideoInfo;
      /** 是否有封面 */
      mediaCover?: boolean;
      /** 是否显示封面 */
      showCover?: boolean;
    }

    type OperationPermission = 'DOWNLOAD' | 'UPLOAD' | 'DELETE' | 'PUT';

    interface ShareInfo {
      shareId: number;
      shortId: string;
      link: string;
      qrCode: string;
      extractionCode: string;
      expireDate?: string | null;
      isPrivate: boolean;
    }

    interface ShareConflictItem {
      fileId: number;
      filePath: string;
      shareId: number;
    }

    interface ShareConflictResponse {
      count: number;
      items: ShareConflictItem[];
    }

    interface GetFileListRequest {
      userId: string;
      currentDirectory: string;
      folder?: import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[];
      page?: number;
      size?: number;
      queryType?: SimpleUploader.Uploader.FileListQueryType;
    }

    interface FileListPagedResponse {
      list: FileItem[];
      total: number;
      page: number;
      size: number;
    }

    interface CheckExistRequest {
      userId?: CommonType.IdType;
      filenames: string[];
      currentDirectory?: string;
    }

    interface CheckExistResponse {
      pass: boolean;
      exist: boolean;
      resume: number[];
      upload: boolean;
      merge: boolean;
    }

    interface CreateFolderParams {
      userId?: CommonType.IdType;
      isFolder: boolean;
      folderPath?: string;
      currentDirectory?: string;
      fileName?: string;
      folder?: import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[];
      relativePath?: string;
      override?: boolean;
    }

    interface RenameFileRequest {
      fileId: string;
      newName: string;
      userId?: CommonType.IdType;
    }

    interface FileMergeRequest {
      fileName: string;
      relativePath?: string;
      identifier?: string;
      folder?: import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[];
      currentDirectory?: string;
      userId?: CommonType.IdType;
      totalSize?: number;
      isFolder?: boolean;
      lastModified?: number;
      fileId?: string;
    }

    interface CreateFileRequest {
      fileName: string;
      folderPath?: string;
      userId?: CommonType.IdType;
    }

    interface CreateFolderRequest {
      isFolder?: boolean;
      folderPath?: string;
      fileName: string;
      folder?: string;
      currentDirectory?: string;
      userId?: CommonType.IdType;
      overwrite?: boolean;
    }

    interface RenameFileRequest {
      fileId: string;
      newName: string;
      userId?: CommonType.IdType;
    }

    interface CreateShareRequest {
      fileId: number;
      isPrivate: boolean;
      validity: string;
      customDays?: number;
      extractionCode?: string;
      autoFillExtractCode: boolean;
      operationPermissionList: OperationPermission[];
    }

    interface UpdateShareRequest {
      isPrivate?: boolean;
      expireAt?: number;
      extractionCode?: string;
      operationPermissionList?: OperationPermission[];
    }

    interface CancelShareRequest {
      shareId: number;
    }

    interface CheckShareConflictRequest {
      folderId: number;
    }

    interface GetShareInfoRequest {
      fileId: number;
    }

    interface IsAllowDownloadResponse {
      allowDownload: boolean;
      downloadUrl?: string;
      isRedirect: boolean;
      redirectUrl?: string;
    }

    interface IsAllowPackageDownloadResponse {
      allowDownload: boolean;
      downloadUrl: string;
    }

    interface PreviewTextFileRequest {
      shareId?: string;
      fileId?: string;
      fileName?: string;
      path?: string;
      userId?: CommonType.IdType;
    }

    interface OnlyOfficeBackendConfig {
      documentServer: string;
      tokenEnabled: boolean;
      secret: string;
      callbackServer: string;
    }

    /** OnlyOffice 配置 */
    interface OnlyOfficeConfig {
      document: {
        fileType: string;
        key: string;
        title: string;
        url: string;
        info?: {
          author?: string;
          created?: string;
          owner?: string;
        };
        permissions?: {
          comment?: boolean;
          copy?: boolean;
          download?: boolean;
          edit?: boolean;
          print?: boolean;
          review?: boolean;
          chat?: boolean;
        };
      };
      editorConfig: {
        callbackUrl: string;
        lang: string;
        mode: string;
        user: {
          id: string;
          name: string;
        };
        customization?: {
          forcesave?: boolean;
        };
      };
      token: string;
      serverUrl: string;
    }
  }
}
