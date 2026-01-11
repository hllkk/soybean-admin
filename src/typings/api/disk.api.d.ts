declare namespace Api {
  namespace Disk {
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
      /** 是否是文件夹 */
      isDir: boolean;
      /** 文件或文件夹路径 */
      filePath?: string;
      /** 文件或文件夹所有者 */
      userId?: CommonType.IdType;
    }

    interface GetFileListRequest {
      userId: string;
      currentDirectory: string;
      folder?: import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[];
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

    interface IsAllowDownloadResponse {
      allowDownload: boolean;
      /** 下载令牌 */
      downloadUrl?: string;
      isRedirect: boolean;
      redirectUrl?: string;
    }
  }
}
