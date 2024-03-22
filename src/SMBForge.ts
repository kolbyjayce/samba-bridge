import { SMBMessage, SMBMessageOptions } from "./SMBMessage";
import * as net from "net";

interface MessageModule {
    generate: (connection: net.Socket, params: any) => SMBMessage;
    parse: (connection: net.Socket, callback: CallbackFunction) => void;
}

type CallbackFunction = (error: Error | null, response?: SMBMessage) => void;

class SMBForge {
    private connection: net.Socket;
    private responses: Map<number, SMBMessage>;
    private callbacks: Map<number, CallbackFunction>;

    constructor(connection: net.Socket) {
        this.connection = connection;
        this.responses = new Map();
        this.callbacks = new Map();

        // Handle incoming data
        this.connection.on('data', (data: Buffer) => this.handleResponse(data));
    }

    // async request(messageName: string, params: SMBMessageOptions): Promise<SMBMessage> {
    //     const msgModule: MessageModule = await import(`../messages/${messageName}`);
    //     const smbMessage = msgModule.generate(this.connection, params);
    //     this.sendNetBiosMessage(smbMessage);

    //     return new Promise<SMBMessage>((resolve, reject) => {
    //         this.callbacks.set(smbMessage.getHeaders().MessageId, (error, response) => {
    //             if (error) {
    //                 reject(error);
    //             } else {
    //                 resolve(response);
    //             }
    //         });
    //     });
    // }

    private sendNetBiosMessage(message: SMBMessage): void {
        const smbRequest = message.getBuffer();
        let buffer = Buffer.alloc(smbRequest.length + 4);
        buffer.writeUInt8(0x00, 0); // NetBios cmd
        buffer.writeUInt8((smbRequest.length >> 16) & 0xFF, 1); // Message length
        buffer.writeUInt16BE(smbRequest.length & 0xFFFF, 2);
        smbRequest.copy(buffer, 4);

        this.connection.write(buffer);
    }

    private handleResponse(data: Buffer): void {
        // Simplified response handling
        // This method needs to parse the incoming data into SMBMessage instances and call the appropriate callback
        const messageId = 0; // Placeholder: Extract the messageId from the response data
        const response = new SMBMessage(); // Placeholder: Parse the data into an SMBMessage

        if (this.callbacks.has(messageId)) {
            const callback = this.callbacks.get(messageId)!;
            callback(null, response);
            this.callbacks.delete(messageId);
        } else {
            this.responses.set(messageId, response);
        }
    }
}

export { SMBForge };
