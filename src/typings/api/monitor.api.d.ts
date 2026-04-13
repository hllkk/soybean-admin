declare namespace Api {
  /**
   * namespace Monitor
   *
   * backend api module: "monitor"
   */
  namespace Monitor {
    /** 在线设备 */
    interface OnlineDevice {
      tokenId: string;
      userId: CommonType.IdType;
      userName: string;
      deviceType: string;
      ipaddr: string;
      loginLocation: string;
      browser: string;
      os: string;
      loginTime: string;
    }

    /** 在线设备列表 */
    type OnlineDeviceList = OnlineDevice[];
  }
}