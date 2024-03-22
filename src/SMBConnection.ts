import * as net from "net";
import { SMBClient } from "./SMB";
import { ReponseHandler } from "./ResponseHandler";

export class SMBConnection {
    private socket: net.Socket = new net.Socket({ allowHalfOpen: true });
    private connected: boolean = false;
    private scheduledAutoClose: NodeJS.Timeout | null = null;
    private responseHandler: ResponseHandler = new ResponseHandler()

    constructor(private client: SMBClient) {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // set socket event listeners
        this.socket.on('data', (data: Buffer) => responseHandler.handleResponse(data); );

        this.socket.on('error', (err) => {
            if (this.client.debug) {
                console.error("An ERROR Occurred: ", err);
            }
        });

        this.socket.on('close', () => {
            this.connected = false;
            this.clearAutoCloseTimeout();
            console.log("Connection closed.");
        })
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {

            if (this.connected) {
                console.log("Error: Already Connected");
                resolve();
                return;
            }
            
            this.socket.connect(this.client.port, this.client.ip, () => {
                this.connected = true;
                console.log("Socket successfully connected");
                this.setAutoCloseTimeout(); // setup auto close after connection is established
                resolve();
            });

            this.socket.once('error', (err) => { // socket error handler once for the rejection of connection
                reject(err);
            })
        })
    }
        
    public close(): void {
        this.clearAutoCloseTimeout();
        if (this.connected) {
            this.connected = false;
            this.socket.end();
            console.log("Connection closed programmatically");
        }
    }

    // handle data received from server
    // private handleData(data: Buffer): void {
    //     // Process the received data
    //     console.log("Data received from server:", data.toString());
    //     // Here you would parse the SMB response and take appropriate actions
    //     // This could involve invoking callbacks or processing data
        
    //     this.setAutoCloseTimeout(); // Reset the auto-close timeout whenever data is received
    // }

    private clearAutoCloseTimeout(): void {
        if (this.scheduledAutoClose) {
            clearTimeout(this.scheduledAutoClose);
            this.scheduledAutoClose = null;
        }
    }

    private setAutoCloseTimeout(): void {
        this.clearAutoCloseTimeout();
        if (this.client.autoCloseTimeout !== 0) {
            this.scheduledAutoClose = setTimeout(() => {
                this.close();
            }, this.client.autoCloseTimeout);
        }
    }

    // Start Section: SMB Method Requests
    public sendFileExistsRequest(filePath: string): boolean {
        
        return false;
    }

    public sendFileReadRequest(filePath: string): Buffer {

        return Buffer.from("0xff");
    }

}