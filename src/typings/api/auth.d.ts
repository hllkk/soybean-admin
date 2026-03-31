declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
      expiresAt: number;
    }

    interface UserInfo {
      userId: CommonType.IdType;
      userName: string;
      nickName: string;
      userAvatar: string;
      userEmail: string;
      userPhone: string;
      userGender: number;
      roleId: number;
      lastLogin: string;
      status: string;
      role: string;
      roles: string[];
      buttons: string[];
    }
  }
}
