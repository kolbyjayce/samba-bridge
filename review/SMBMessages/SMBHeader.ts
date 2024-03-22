export class SMBHeader {
  private protocolId: Buffer = Buffer.from([
    0xff,
    "S".charCodeAt(0),
    "M".charCodeAt(0),
    "B".charCodeAt(0),
  ]); // 4 bytes SMB as ascii values
  private headerSize: number = 64;
  private command: number;
  private messageId: bigint;
  private sessionId: bigint;
  private processId: number;

  private readonly headerTranslates = {
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

  private readonly flags = {
    SERVER_TO_REDIR: 0x00000001,
    ASYNC_COMMAND: 0x00000002,
    RELATED_OPERATIONS: 0x00000004,
    SIGNED: 0x00000008,
    DFS_OPERATIONS: 0x10000000,
    REPLAY_OPERATION: 0x20000000,
  };

  // Constructor
  constructor(
    command: string,
    messageId: bigint,
    sessionId: bigint,
    processId: number,
  ) {
    this.command = this.headerTranslates["Command"][command];
    this.messageId = messageId;
    this.sessionId = sessionId;
    this.processId = processId;
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.headerSize);
    buffer.fill(0);

    this.protocolId.copy(buffer, 0); // protocolId at position 0 of header
    return new Buffer(0xff);
  }
}
