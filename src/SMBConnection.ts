import * as net from "net";
import { SMBClient } from "./SMBClient";

export class SMBConnection {
    private socket: net.Socket = new net.Socket({ allowHalfOpen: true });
    private connected: boolean = false;
    private scheduledAutoClose: NodeJS.Timeout | null = null;

    constructor(private client: SMBClient) {
        this.init();
    }

    private init(): void {
        // set socket behavior
        this.socket.on('data', () => console.log("not setup yet"));
        this.socket.on('error', (err) => {
            if (this.client.debug) {
                console.error("An ERROR Occurred: ", err);
            }
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
                resolve();
            });
            
            this.socket.on('error', (err) => {
                reject(err);
            })
            
            this.socket.on('close', () => {
                this.connected = false;
                this.clearAutoCloseTimeout();
            });

        })
    }
        
        public close(): void {
            this.clearAutoCloseTimeout();
            console.log(this.connected, "is connection status")
            if (this.connected) {
                this.connected = false;
            this.socket.end();
        }
    }

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
}