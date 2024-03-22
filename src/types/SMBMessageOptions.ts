export interface SMBMessageOptions {
  headers?: Record<string, any>;
  request?: Record<string, any>;
  isAsync?: boolean;
  processId?: number;
  sessionId?: number;
  messageId?: number;
}
