declare namespace Api {
  namespace Sse {
    type MessageType =
      | 'heartbeat'
      | 'disk_compress'
      | 'disk_extract'
      | 'disk_upload'
      | 'disk_download'
      | 'disk_delete'
      | 'disk_move'
      | 'disk_copy'
      | 'system_notification'
      | 'user_message';

    interface SSEMessage {
      type: MessageType;
      data: any;
      timestamp: number;
    }

    interface SSEHeartbeatMessage extends SSEMessage {
      type: 'heartbeat';
      data: null;
    }

    interface DiskCompressMessage extends SSEMessage {
      type: 'disk_compress';
      data: {
        taskId: string;
        fileName: string;
        progress: number;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        error?: string;
      };
    }

    interface DiskExtractMessage extends SSEMessage {
      type: 'disk_extract';
      data: {
        taskId: string;
        fileName: string;
        progress: number;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        error?: string;
      };
    }

    interface DiskUploadMessage extends SSEMessage {
      type: 'disk_upload';
      data: {
        taskId: string;
        fileName: string;
        progress: number;
        uploaded: number;
        total: number;
        status: 'pending' | 'uploading' | 'completed' | 'failed';
        error?: string;
      };
    }

    interface DiskDownloadMessage extends SSEMessage {
      type: 'disk_download';
      data: {
        taskId: string;
        fileName: string;
        progress: number;
        downloaded: number;
        total: number;
        status: 'pending' | 'downloading' | 'completed' | 'failed';
        error?: string;
      };
    }

    interface SystemNotificationMessage extends SSEMessage {
      type: 'system_notification';
      data: {
        title: string;
        content: string;
        level: 'info' | 'warning' | 'error' | 'success';
      };
    }

    interface UserMessage extends SSEMessage {
      type: 'user_message';
      data: {
        fromUserId: number;
        fromUserName: string;
        content: string;
        timestamp: number;
      };
    }

    type SSEEventMessage =
      | SSEHeartbeatMessage
      | DiskCompressMessage
      | DiskExtractMessage
      | DiskUploadMessage
      | DiskDownloadMessage
      | SystemNotificationMessage
      | UserMessage;

    interface SSEConnectionOptions {
      onMessage?: (message: SSEEventMessage) => void;
      onError?: (error: Event) => void;
      onOpen?: (event: Event) => void;
      onClose?: (event: Event) => void;
      reconnectInterval?: number;
      maxReconnectAttempts?: number;
    }
  }
}
