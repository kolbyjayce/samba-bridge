import { PIDGenerator } from "./PIDGenerator";
import { SMBOptions } from "./types/SMBOptions";
import { SMBConnection } from "./SMBConnection";

export class SMB {
  // const client variables
  private shareRegEx = /\\\\([^\\]*)\\([^\\]*)\\?/;
  private messageId: number;
  private share: string;
  private fullPath: string;
  private packetConcurrency: number;
  private username: string;
  private password: string;

  private pidHigh: number;
  private pidLow: number;

  private connection: SMBConnection;

  // public variables needed by SMBConnection
  public autoCloseTimeout: number;
  public debug: boolean;
  public ip: string;
  public port: number;
  // private domain: string; // check if needed in option call

  constructor(private options: SMBOptions) {
    const match = options.host.match(this.shareRegEx);
    if (!match) {
      // invalid share provided
      throw new Error("Invalid Share was provided");
    } else {
      // assign class variables
      this.ip = match[1];
      this.share = match[2];
    }

    this.port = options.port ? options.port : 445; // default smb port
    this.messageId = 0;
    this.fullPath = options.host;
    this.packetConcurrency = options.packetConcurrency
      ? options.packetConcurrency
      : 20;
    this.autoCloseTimeout = options.autoCloseTimeout
      ? options.autoCloseTimeout
      : 10000; // default timeout to 10 seconds

    this.username = options.username;
    this.password = options.password;

    const pidGenerator = new PIDGenerator();
    const { PIDHigh, PIDLow } = pidGenerator.generatePID(); // SMB header takes both high and low pid in different sections
    this.pidHigh = PIDHigh;
    this.pidLow = PIDLow;

    this.debug = options.debug ? options.debug : false;

    this.connection = new SMBConnection(this);
  }

  async connect(): Promise<void> {
    await this.connection.connect();
  }

  close(): void {
    this.connection.close();
  }

  // SMB protocol methods
  public exists(filePath: string): boolean {
    return this.connection.sendFileExistsRequest(filePath);
  }

  public readFile(filePath: string): Buffer {
    return this.connection.sendFileReadRequest(filePath);
  }
}
