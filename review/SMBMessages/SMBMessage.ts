export class SMBMessage {
  private static readonly protocolId = Buffer.from([
    0xfe,
    "S".charCodeAt(0),
    "M".charCodeAt(0),
    "B".charCodeAt(0),
  ]);
  private static headerLength = 64;
  private static headerTranslates = {
    Command: {
      NEGOTIATE: 0x0000,
      SESSION_SETUP: 0x0001,
      LOGOFF: 0x0002,
      TREE_CONNECT: 0x0003,
      TREE_DISCONNECT: 0x0004,
      CREATE: 0x0005,
      CLOSE: 0x0006,
      FLUSH: 0x0007,
      READ: 0x0008,
      WRITE: 0x0009,
      LOCK: 0x000a,
      IOCTL: 0x000b,
      CANCEL: 0x000c,
      ECHO: 0x000d,
      QUERY_DIRECTORY: 0x000e,
      CHANGE_NOTIFY: 0x000f,
      QUERY_INFO: 0x0010,
      SET_INFO: 0x0011,
      OPLOCK_BREAK: 0x0012,
    },
  };
  private static flags = {
    SERVER_TO_REDIR: 0x00000001,
    ASYNC_COMMAND: 0x00000002,
    RELATED_OPERATIONS: 0x00000004,
    SIGNED: 0x00000008,
    DFS_OPERATIONS: 0x10000000,
    REPLAY_OPERATION: 0x20000000,
  };

  private headers: Record<string, any> = {};
  private request: Record<string, any> = {};
  private response: Record<string, any> = {};
  private isMessageIdSetted = false;

  constructor(options?) {
    if (options?.headers) {
      this.setHeaders(options.headers);
    }
    if (options?.request) {
      this.setRequest(options.request);
    }
  }

  private setHeaders(headers: Record<string, any>): void {
    this.headers = { ...this.headers, ...headers };
  }

  public getHeaders(): Record<string, any> {
    return this.headers;
  }

  private setRequest(request: Record<string, any>): void {
    this.request = request;
  }

  getResponse(): Record<string, any> {
    return this.response;
  }
}
