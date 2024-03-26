import { PIDGenerator } from "./PIDGenerator";
import { SMBOptions } from "./types/SMBOptions";
import { SMBConnection } from "./SMBConnection";
import { Socket } from "net";
import { SMBClient } from "./SMBClient";

export class SMB {
  // const client variables
  private shareRegEx = /\\\\([^\\]*)\\([^\\]*)\\?/;
  private messageId: number;
  private share: string;
  private fullPath: string;
  private packetConcurrency: number;
  private sessionId: number;
//   private pidHigh: number;
//   private pidLow: number;
  private ProcessId: Buffer;
  
  // public variables needed by SMBConnection
  public autoCloseTimeout: number;
  public debug: boolean;
  public ip: string;
  public port: number;
  public connected: boolean = false;
  public socket: Socket | undefined;
  public errorHandler: Array<any> = [];

  // auth information
  private domain: string;
  private username: string;
  private password: string;

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
        this.domain = options.domain;
        this.sessionId = Math.floor(Math.random() * 256) & 0xFF;

        // const pidGenerator = new PIDGenerator();
        // const { PIDHigh, PIDLow } = pidGenerator.generatePID(); // SMB header takes both high and low pid in different sections
        // this.pidHigh = PIDHigh;
        // this.pidLow = PIDLow;
        this.ProcessId = PIDGenerator.generatePID();

        this.debug = options.debug ? options.debug : false;

        SMBConnection.init(this);
    }

    close(): void {
        SMBConnection.close(this);
    }

    exists = SMBConnection.requireConnect((path: string, cb: any) => {
        SMBClient.request('open', { path: path }, this, (err, file) => {
            if (err) {
                cb && cb(null, false);
            } else SMBClient.request('close', file, this, (err) => {
                cb && cb(null);
            })
        })
    })
}
