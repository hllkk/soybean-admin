import { onUnmounted, ref } from 'vue';
import { getServiceBaseURL } from '@/utils/service';

interface SSEConnectionState {
  eventSource: EventSource | null;
  reconnectAttempts: number;
  isConnected: boolean;
  messageHandlers: Map<Api.Sse.MessageType, Set<(message: Api.Sse.SSEEventMessage) => void>>;
}

const connections = new Map<string, SSEConnectionState>();

export function useSSE() {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const reconnectInterval = 5000;
  const maxReconnectAttempts = 10;

  const createConnection = (connectionId: string, options: Api.Sse.SSEConnectionOptions = {}) => {
    if (connections.has(connectionId)) {
      console.warn(`SSE连接 ${connectionId} 已存在`);
      return connections.get(connectionId)!;
    }

    const state: SSEConnectionState = {
      eventSource: null,
      reconnectAttempts: 0,
      isConnected: false,
      messageHandlers: new Map()
    };

    const connect = () => {
      if (state.eventSource) {
        state.eventSource.close();
      }

      const token = localStorage.getItem('token');
      const url = `${baseURL}/sse/connect?token=${token}`;

      state.eventSource = new EventSource(url);

      state.eventSource.onopen = event => {
        state.isConnected = true;
        state.reconnectAttempts = 0;
        console.log(`SSE连接 ${connectionId} 已建立`);
        options.onOpen?.(event);
      };

      state.eventSource.onmessage = event => {
        try {
          const message: Api.Sse.SSEEventMessage = JSON.parse(event.data);

          if (message.type === 'heartbeat') {
            return;
          }

          const handlers = state.messageHandlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message));
          }

          options.onMessage?.(message);
        } catch (error) {
          console.error('解析SSE消息失败:', error);
        }
      };

      state.eventSource.onerror = error => {
        state.isConnected = false;
        console.error(`SSE连接 ${connectionId} 发生错误:`, error);
        options.onError?.(error);

        if (state.reconnectAttempts < maxReconnectAttempts) {
          state.reconnectAttempts += 1;
          console.log(`尝试重连SSE连接 ${connectionId} (${state.reconnectAttempts}/${maxReconnectAttempts})`);
          setTimeout(connect, reconnectInterval);
        } else {
          console.error(`SSE连接 ${connectionId} 达到最大重试次数，停止重连`);
          options.onClose?.(error);
        }
      };
    };

    connect();
    connections.set(connectionId, state);

    return state;
  };

  const closeConnection = (connectionId: string) => {
    const state = connections.get(connectionId);
    if (state) {
      if (state.eventSource) {
        state.eventSource.close();
      }
      connections.delete(connectionId);
      console.log(`SSE连接 ${connectionId} 已关闭`);
    }
  };

  const subscribe = (
    connectionId: string,
    messageType: Api.Sse.MessageType,
    handler: (message: Api.Sse.SSEEventMessage) => void
  ) => {
    const state = connections.get(connectionId);
    if (!state) {
      console.error(`SSE连接 ${connectionId} 不存在`);
      return () => {};
    }

    if (!state.messageHandlers.has(messageType)) {
      state.messageHandlers.set(messageType, new Set());
    }

    state.messageHandlers.get(messageType)!.add(handler);

    return () => {
      const handlers = state.messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          state.messageHandlers.delete(messageType);
        }
      }
    };
  };

  const unsubscribe = (connectionId: string, messageType: Api.Sse.MessageType) => {
    const state = connections.get(connectionId);
    if (state) {
      state.messageHandlers.delete(messageType);
    }
  };

  const getConnectionState = (connectionId: string) => {
    return connections.get(connectionId);
  };

  const isConnected = (connectionId: string) => {
    const state = connections.get(connectionId);
    return state?.isConnected ?? false;
  };

  const useSSEConnection = (connectionId: string, options: Api.Sse.SSEConnectionOptions = {}) => {
    const state = ref(createConnection(connectionId, options));

    onUnmounted(() => {
      closeConnection(connectionId);
    });

    return {
      isConnected: state.value.isConnected,
      subscribe: (messageType: Api.Sse.MessageType, handler: (message: Api.Sse.SSEEventMessage) => void) => {
        return subscribe(connectionId, messageType, handler);
      },
      unsubscribe: (messageType: Api.Sse.MessageType) => {
        unsubscribe(connectionId, messageType);
      },
      close: () => {
        closeConnection(connectionId);
      }
    };
  };

  return {
    createConnection,
    closeConnection,
    subscribe,
    unsubscribe,
    getConnectionState,
    isConnected,
    useSSEConnection
  };
}
