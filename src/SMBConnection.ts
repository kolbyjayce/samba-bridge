import * as net from "net";
import { SMBClient } from "./SMBClient";
import { SMB } from "./SMB";
import { IConnection } from "./types/Connection";

export class SMBConnection {
    private connectionInfo: IConnection;

    constructor(connectionOptions: IConnection) {
        this.connectionInfo = {...connectionOptions, responseBuffer: Buffer.alloc(0), responses: {}, responsesCB: {} };
        this.setEventListeners();
    }

    private setEventListeners(): void {
        this.connectionInfo.socket.on('data', (data: Buffer) => {
            SMBClient.response(this.connectionInfo, data);
        });
        
        this.connectionInfo.errorHandler = [];
        
        this.connectionInfo.socket.on('error', (err: any) => {
            if (this.connectionInfo.errorHandler.length > 0) {
                this.connectionInfo.errorHandler[0].call(null, err)
            }
            if (this.connectionInfo.debug) {
                console.error("-----ERROR-----");
                console.log(err);
            }
        });
    }
    
    public close() {
        this.connectionInfo.socket.end();
        this.clearAutoCloseTimeout();
        if (this.connectionInfo.connected) {
            this.connectionInfo.connected = false;
        };
    }

    public async requireConnect(): Promise<void> {
        if (!this.connectionInfo) {
            throw new Error("Connection Information is not yet initialized.");
        }

        try {
            await this.connect();

            if (this.connectionInfo.scheduledAutoClose) {
                this.connectionInfo.scheduledAutoClose();
            } else {
                throw new Error("Auto Close Not initialized Correctly.");
            }

        } catch (err) {
            console.error("Error occurred while connecting:", err);
            this.close();
        }
    }


    public async connect(): Promise<void> {
        if (this.connectionInfo.connected) return;
    
        this.connectionInfo.socket.connect(this.connectionInfo.port, this.connectionInfo.ip);
        try {
            await SMBClient.request('negotiate', {}, this.connectionInfo);
            await SMBClient.request('session_setup_step1', {}, this.connectionInfo);
            await SMBClient.request('session_setup_step2', {}, this.connectionInfo);
            await SMBClient.request('tree_connect', {}, this.connectionInfo);
    
            this.connectionInfo.connected = true;
            this.setAutoCloseTimeout();
    
        } catch (err) {
            console.log("Error establishing connection:", err);
            this.close();
        }
    }

    // Private Functions
    private clearAutoCloseTimeout() {
        if (this.connectionInfo.autoCloseTimeout) {
            clearTimeout(this.connectionInfo.scheduledAutoClose);
            this.connectionInfo.scheduledAutoClose = null;
        }
    }

    private setAutoCloseTimeout(): void {
        this.clearAutoCloseTimeout();
        if (this.connectionInfo.autoCloseTimeout != 0 && this.connectionInfo) {
            this.connectionInfo.scheduledAutoClose = setTimeout(() => {
                this.close();
            }, this.connectionInfo.autoCloseTimeout);
        } else {
            throw new Error("Connection info not ready.");
        }
    }

    private scheduleAutoClose(): void {
        this.clearAutoCloseTimeout();
        this.setAutoCloseTimeout();
    }

    // private error handlers
    private addErrorListener(): void {
        const errorHandler = (err: Error) => {
            console.error(err);
            // Additional error handling logic here
        };
    
        if (!this.connectionInfo.errorHandler.includes(errorHandler)) {
            this.connectionInfo.errorHandler.push(errorHandler);

            this.connectionInfo.socket.on('error', errorHandler);
        }
    }
}