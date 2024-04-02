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
    private connection: SMBConnection;

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
            workstation: options.workstation,
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
        this.connection = new SMBConnection(this.connectionParams);
        // SMBConnection.init(this.connectionParams);
    }

    public close(): void {
        this.connection.close();
    }

    public async exists(path: string): Promise<boolean> {
        try {
            await this.connection.requireConnect();
            console.log("CONNECTION ESTABLISHED")
            const file = await SMBClient.request('open', {path: path}, this.connectionParams);
            await SMBClient.request('close', file, this.connectionParams);
            return true;
        } catch (err) {
            console.error(err);
            this.close();
            return false; // an error occurred so assume file doesn't exist
        }
    }
}
