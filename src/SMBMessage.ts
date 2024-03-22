// SMBMessage.ts
import { SMBMessageOptions } from "./types/SMBMessageOptions";

export class SMBMessage {
    private static readonly protocolId = Buffer.from([0xFE, 'S'.charCodeAt(0), 'M'.charCodeAt(0), 'B'.charCodeAt(0)]);
    private static readonly headerLength = 64;

    private headers: Record<string, any>;
    private request: Record<string, any>;
    private response: Record<string, any>;
    private isAsync: boolean;
    private processId: number;
    private sessionId: number;
    private messageId: number;

    constructor(options: SMBMessageOptions = {}) {
        this.headers = options.headers || {};
        this.request = options.request || {};
        this.response = {};
        this.isAsync = options.isAsync || false;
        this.processId = options.processId || 0;
        this.sessionId = options.sessionId || 0;
        this.messageId = options.messageId || 0;
    }

    public setHeaders(headers: Record<string, any>): void {
        this.headers = { ...this.headers, ...headers };
    }

    public getHeaders(): Record<string, any> {
        return this.headers;
    }

    public setRequest(request: Record<string, any>): void {
        this.request = { ...this.request, ...request };
    }

    public getResponse(): Record<string, any> {
        return this.response;
    }

    public getBuffer(): Buffer {
        const headerBuffer = Buffer.alloc(SMBMessage.headerLength);
        const bodyBuffer = Buffer.from(JSON.stringify(this.request));

        headerBuffer.writeUInt32LE(this.processId, 0);
        headerBuffer.writeUInt32LE(this.sessionId, 4);
        headerBuffer.writeUInt32LE(this.messageId, 8);

        return Buffer.concat([headerBuffer, bodyBuffer]);
    }

    public parseBuffer(buffer: Buffer): void {
        const responseBody = buffer.slice(SMBMessage.headerLength);
        try {
            this.response = JSON.parse(responseBody.toString());
        } catch (e) {
            console.error('Failed to parse response body:', e);
            this.response = {};
        }
    }
}
export { SMBMessageOptions };

