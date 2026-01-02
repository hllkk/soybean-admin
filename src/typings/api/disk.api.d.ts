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

    interface CreateFolderRequest {
      userId?: CommonType.IdType;
      isFolder: boolean;
      folderPath: string;
      currentDirectory?: string;
      fileName: string;
      folder?: import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[];
    }
  }
}
