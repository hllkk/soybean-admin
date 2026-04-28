import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';
import { fetchRefreshToken } from '../api';
import type { RequestInstanceState } from './type';

export function getAuthorization(): null {
  return null;
}

/** refresh token */
async function handleRefreshToken() {
  const { resetStore } = useAuthStore();

  // Refresh token is sent via HttpOnly cookie by the browser
  const { error } = await fetchRefreshToken();
  if (!error) {
    return true;
  }

  // 清除认证信息，resetStore 内部会尝试跳转登录页
  try {
    await resetStore();
  } catch {
    localStg.remove('isAuthenticated');
    localStg.remove('token');
    localStg.remove('refreshToken');
  }

  return false;
}

export async function handleExpiredRequest(state: RequestInstanceState) {
  if (!state.refreshTokenPromise) {
    state.refreshTokenPromise = handleRefreshToken();
  }

  const success = await state.refreshTokenPromise;

  setTimeout(() => {
    state.refreshTokenPromise = null;
  }, 1000);

  return success;
}

export function showErrorMsg(state: RequestInstanceState, message: string) {
  if (!state.errMsgStack?.length) {
    state.errMsgStack = [];
  }

  const isExist = state.errMsgStack.includes(message);

  if (!isExist) {
    state.errMsgStack.push(message);

    window.$message?.error(message, {
      onLeave: () => {
        state.errMsgStack = state.errMsgStack.filter(msg => msg !== message);

        setTimeout(() => {
          state.errMsgStack = [];
        }, 5000);
      }
    });
  }
}
