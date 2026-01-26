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
      downloadUrl?: string;
      isRedirect: boolean;
      redirectUrl?: string;
    }

    interface IsAllowPackageDownloadResponse {
      allowDownload: boolean;
      downloadUrl: string;
    }
  }
}
