declare namespace Api {
  /**
   * namespace Init
   *
   * backend api module: "init"
   */
  namespace Init {
    /** 检查数据库初始化状态响应 */
    interface CheckDBResponse {
      needInit: boolean;
    }

    /** 初始化数据库请求参数 */
    interface InitDBRequest {
      /** 管理员密码 */
      adminPassword: string;
      /** 数据库类型: mysql, pgsql, sqlite, mssql */
      dbType: string;
      /** 服务器地址 */
      host: string;
      /** 数据库连接端口 */
      port: string;
      /** 数据库用户名 */
      userName: string;
      /** 数据库密码 */
      password: string;
      /** 数据库名 */
      dbName: string;
      /** sqlite数据库文件路径 */
      dbPath?: string;
      /** postgresql指定template */
      template?: string;
      /** Redis服务器地址(IP:端口格式) */
      redisAddr?: string;
      /** Redis服务器IP地址 */
      redisIP?: string;
      /** Redis服务器端口 */
      redisPort?: string;
      /** Redis密码 */
      redisPassword?: string;
      /** Redis数据库编号 */
      redisDB?: number;
      /** 是否使用Redis集群 */
      redisUseCluster?: boolean;
      /** Redis集群地址列表 */
      redisClusterAddrs?: string[];
    }

    /** 数据库类型选项 */
    type DBType = 'mysql' | 'pgsql' | 'sqlite' | 'mssql';
  }
}
