import { PIDGenerator } from "./PIDGenerator";
import { SMBOptions } from "./types/SMBOptions";
import { SMBConnection } from "./SMBConnection";
import { Socket } from "net";
import { SMBClient } from "./SMBClient";
import { IConnection } from "./types/Connection";

export class SMB {
  // const client variables
    private shareRegEx = /\\\\([^\\]*)\\([^\\]*)\\?/;
    private connectionParams: IConnection; // hold all connection information

    constructor(private options: SMBOptions) {
        const match = options.host.match(this.shareRegEx);
        if (!match) throw new Error("Invalid Share was provided");
            // assign class variables
        const params: IConnection = {
            ip: match[1],
            share: match[2],
            port: options.port ? options.port : 445,
            messageId: 0,
            fullPath: options.host,
            packetConcurrency: options.packetConcurrency ? options.packetConcurrency : 20,
            autoCloseTimeout: options.autoCloseTimeout ? options.autoCloseTimeout : 10000, // default to 10 seconds
            username: options.username,
            password: options.password,
            domain: options.domain,
            SessionId: Math.floor(Math.random() * 256) & 0xFF,
            ProcessId: PIDGenerator.generatePID(),
            debug: options.debug ? options.debug : false,
            connected: false,
            errorHandler: [],
            responsesCB: {}, // used in SMBClient.request
            responses: {}, // used in SMBClient.request
            socket: new Socket({ allowHalfOpen: true })
        }
        // const pidGenerator = new PIDGenerator();
        // const { PIDHigh, PIDLow } = pidGenerator.generatePID(); // SMB header takes both high and low pid in different sections
        // this.pidHigh = PIDHigh;
        // this.pidLow = PIDLow;

        this.connectionParams = params;
        SMBConnection.init(this.connectionParams);
    }

    close(): void {
        SMBConnection.close(this);
    }

    exists = SMBConnection.requireConnect((path: string, cb: any) => {
        SMBClient.request('open', { path: path }, this.connectionParams, (err, file) => {
            if (err) {
                cb && cb(null, false);
            } else SMBClient.request('close', file, this.connectionParams, (err) => {
                cb && cb(null);
            })
        })
    })
}
