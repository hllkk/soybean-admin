/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  /**
   * namespace Disk
   *
   * backend api module: "disk"
   */
  namespace Disk {
    /** 文件类型枚举 */
    type FileType = 'all' | 'image' | 'document' | 'video' | 'audio' | 'other';

    /** 文件项 */
    type FileItem = Common.CommonRecord<{
      /** 文件ID */
      fileId: CommonType.IdType;
      /** 文件名 */
      fileName: string;
      /** 文件类型 (folder/image/document/video/audio/other) */
      fileType: string;
      /** 文件大小 (字节) */
      fileSize: number;
      /** 文件扩展名 */
      fileExtension?: string;
      /** 父文件夹ID */
      parentId: CommonType.IdType | null;
      /** 文件路径 */
      filePath: string;
      /** 修改时间 */
      modifyTime: string;
      /** 是否为文件夹 */
      isFolder: boolean;
      /** 文件URL (非文件夹) */
      fileUrl?: string;
      /** 文件图标 */
      icon?: string;
    }>;

    /** 文件列表响应 */
    type FileList = Common.PaginatingQueryRecord<FileItem>;

    /** 文件搜索参数 */
    type FileSearchParams = CommonType.RecordNullable<{
      /** 文件类型筛选 */
      fileType: FileType | null;
      /** 搜索关键词 */
      keyword: string | null;
      /** 父文件夹ID */
      parentId: CommonType.IdType | null;
      /** 排序字段 */
      sortField: 'name' | 'size' | 'modifyTime' | 'type' | null;
      /** 排序方式 */
      sortOrder: 'asc' | 'desc' | null;
      /** 分页参数 */
      pageNum: number;
      pageSize: number;
    }>;

    /** 上传文件参数 */
    type UploadFileParams = {
      /** 文件 */
      file: File;
      /** 目标文件夹ID */
      parentId: CommonType.IdType | null;
    };

    /** 新建文件夹参数 */
    type CreateFolderParams = {
      /** 文件夹名称 */
      folderName: string;
      /** 父文件夹ID */
      parentId: CommonType.IdType | null;
    };

    /** 传输项 */
    type TransferItem = {
      /** 传输ID */
      transferId: string;
      /** 文件名 */
      fileName: string;
      /** 文件类型 */
      fileType: string;
      /** 传输类型 (upload/download) */
      transferType: 'upload' | 'download';
      /** 传输状态 */
      status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'transferring' | 'merging' | 'paused' | 'completed' | 'failed';
      /** 进度百分比 */
      progress: number;
      /** 已传输大小 */
      transferredSize: number;
      /** 总大小 */
      totalSize: number;
      /** 传输速度 */
      speed: number;
      /** 剩余时间 */
      remainingTime: number;
      /** 分片进度描述 */
      chunkProgress?: string;
      /** 错误信息 */
      error?: string;
      /** 所属文件夹分组ID */
      folderId?: string;
      /** 所属文件夹名称 */
      folderName?: string;
    };

    /** 面包屑项 */
    type BreadcrumbItem = {
      /** 文件夹ID (null表示根目录) */
      fileId: CommonType.IdType | null;
      /** 文件夹名称 */
      fileName: string;
      /** 路径字符串 */
      filePath: string;
    };

    /** 路径解析响应 */
    type PathResolveResponse = {
      /** 最终文件夹ID */
      fileId: CommonType.IdType;
      /** 文件夹名称 */
      fileName: string;
      /** 父目录ID */
      parentId: CommonType.IdType | null;
      /** 路径字符串 */
      filePath: string;
      /** 面包屑链 */
      breadcrumb: BreadcrumbItem[];
    };
  }
}