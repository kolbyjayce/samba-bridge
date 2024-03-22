// Options available when creating instance of SMBConnector
export interface SMBOptions {
  host: string;
  username: string;
  password: string;
  domain?: string;
  port?: number;
  packetConcurrency?: number;
  autoCloseTimeout?: number;
  debug?: boolean;
}
