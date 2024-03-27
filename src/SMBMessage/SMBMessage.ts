import { Buffer } from "buffer";

import { structures } from "../utils/Structures";

import { IStructure, IStructureOptions } from "../types/Structures";
import { ICommandTranslations, IHeaderTranslations } from "../types/SMBMessage";
import { MessageDefaults } from "../utils/Message";

type HeaderEntry = [string, number] | [string, number, any];

interface IHeader {
    [key: string]: any;
}

interface IRequest {
    request?: [string, number | string, any][];
    [key: string]: any;
}

interface IResponse {
    [key: string]: any;
}

const protocolId = Buffer.from([
  0xFE,
  'S'.charCodeAt(0), 
  'M'.charCodeAt(0), 
  'B'.charCodeAt(0)
]);
const headerLength = 64;

const headerTranslates: IHeaderTranslations = {
    'Command': {
        'NEGOTIATE': 0x0000
        , 'SESSION_SETUP': 0x0001
        , 'LOGOFF': 0x0002
        , 'TREE_CONNECT': 0x0003
        , 'TREE_DISCONNECT': 0x0004
        , 'CREATE': 0x0005
        , 'CLOSE': 0x0006
        , 'FLUSH': 0x0007
        , 'READ': 0x0008
        , 'WRITE': 0x0009
        , 'LOCK': 0x000A
        , 'IOCTL': 0x000B
        , 'CANCEL': 0x000C
        , 'ECHO': 0x000D
        , 'QUERY_DIRECTORY': 0x000E
        , 'CHANGE_NOTIFY': 0x000F
        , 'QUERY_INFO': 0x0010
        , 'SET_INFO': 0x0011
        , 'OPLOCK_BREAK': 0x0012
    }
}

const flags = {
    'SERVER_TO_REDIR': 0x00000001
    , 'ASYNC_COMMAND': 0x00000002
    , 'RELATED_OPERATIONS': 0x00000004
    , 'SIGNED': 0x00000008
    , 'DFS_OPERATIONS': 0x10000000
    , 'REPLAY_OPERATION': 0x20000000
}

export class SMBMessage extends MessageDefaults {
    private headers: IHeader = {};
    private response: IResponse = {}; 
    private request: IRequest = {};
    private structure: IStructure = {
        request: [],
        response: []
    };
    private isMessageIdSet: boolean = false;
    private isAsync: boolean = false;

    constructor(private options: any = {}) {
        super();
        if (options.headers) {
            this.setHeaders(options.headers);
        }

        if (options.request) {
            this.setRequest(options.request);
        }

        // overridable functions from Message Defaults
        if (options.parse) {
            this.parse = options.parse;
        }
        if (options.parseResponse) {
            this.parseResponse = options.parseResponse;
        }
        if (options.onSuccess) {
            this.onSuccess = options.onSuccess
        }
        if (options.successCode) {
            this.successCode = options.successCode;
        }
    }

    public setHeaders(newHeaders: IHeader): void {
        this.headers = { ...this.headers, ...newHeaders };
    
        // Convert command to lowercase and search if key is in IStructureOptions
        const commandKey: keyof IStructureOptions | null = (this.headers['Command'].toLowerCase() in structures)
            ? this.headers['Command'].toLowerCase() as keyof IStructureOptions
            : null;
    
        if (commandKey) {
            this.structure = structures[commandKey];
        } else {
            throw new Error(`Unsupported command in structure lookup: ${commandKey}`);
        }
    }
    public getHeaders() { return this.headers; }

    private setRequest(req: IRequest): void { this.request = req; }
    public getResponse(): any { return this.response; }

    public getBuffer(connection: any): Buffer {
        let buffer = Buffer.alloc(0xffff);
        let length = 0;

        if (!this.isMessageIdSet) {
            this.isMessageIdSet = true;
            this.headers['MessageId'] = (connection as any).messageId++;
        };

        length += this.writeHeaders(buffer);

        length += this.writeRequest(buffer, headerLength);

        let output = Buffer.alloc(length);
        buffer.copy(output, 0, 0, length);
        return output;
    }

    public parseBuffer(buffer: Buffer) {
        this.readHeaders(buffer);

        this.readResponse(buffer, headerLength);
    }

    // private methods


    private dataToBuffer(data: Buffer | string | number, length: number): Buffer {
        if (Buffer.isBuffer(data)) { // already a buffer
          return data;
        }
        if (typeof data === 'string') { // convert string to buffer
          return Buffer.from(data);
        }

        // Raw Data needs to be a buffer
        const result = Buffer.alloc(length);
        for (let i = 0; i < length; i++) {
            result.writeUInt8(0xFF & (data >> (i * 8)), i);
        }
        return result;
    }
    
    private bufferToData(buffer: Buffer): number { // will only accept Buffer as input, no need to check
        let result = 0;
        for (let i = 0; i < buffer.length; i++) {
          result += buffer.readUInt8(i) << (i * 8);
        }
        return result;
    }
    
    private writeData(buffer: Buffer, data: any, offset: number, length: number): void {
        this.dataToBuffer(data, length).copy(buffer, offset, 0);
    }
    
    private readData(buffer: Buffer, offset: number, length: number): Buffer {
        return buffer.slice(offset, offset + length);
    }
    
    private translate(key: keyof IHeaderTranslations, value: any): any {
        if (headerTranslates[key] && typeof headerTranslates[key][value] !== 'undefined') {
            return headerTranslates[key][value];
        }
        return value;
    }
    
    private unTranslate(value: number): string | null {
        const commandTranslations: ICommandTranslations = headerTranslates.Command;
        for (const commandName in commandTranslations) {
            if (Object.prototype.hasOwnProperty.call(commandTranslations, commandName)) {
                if (commandTranslations[commandName] === value) {
                    return commandName;
                }
            }
        }
        return null;
    }

    //** Private Buffer Functions */
    private readHeaders(buffer: Buffer): void {
        const header = this.isAsync ? this.headerAsync(this.headers.SessionId) : this.headerSync(this.headers.ProcessId, this.headers.SessionId);
        let offset = 0;
    
        // set headers of message
        for (let i in header) {
            let key = header[i][0];
            let length = header[i][1];

            this.headers[key] = this.readData(buffer, offset, length);

            if (length <= 8) {
                this.headers[key] = this.unTranslate(this.bufferToData(this.headers[key] as Buffer)) || this.headers[key];
            }
            offset += length
        }
    
        // Set structure with typescript overhead type safety
        const commandKey: keyof IStructureOptions | null = (this.headers['Command'].toLowerCase() in structures)
        ? this.headers['Command'].toLowerCase() as keyof IStructureOptions
        : null;

        if (commandKey) {
            this.structure = structures[commandKey];
        } else {
            throw new Error(`Unsupported command in structure lookup: ${commandKey}`);
        }
    }

    private writeHeaders(buffer: Buffer): number {
        const header = this.isAsync ? this.headerAsync(this.headers.SessionId) : this.headerSync(this.headers.ProcessId, this.headers.SessionId);
        let offset = 0;
      
        header.forEach(([name, length, defaultValue = 0]: [string, number, any?]) => {
            const value = this.translate(name as keyof IHeaderTranslations, this.headers[name] || defaultValue);
            this.writeData(buffer, value, offset, length);
            offset += length;
        });
      
        return offset;
    }

    private readResponse(buffer: Buffer, offset: number): void {
        Object.entries(this.structure.response).forEach(([name, lengthOrRef]: [string, any]) => {
            let length = typeof lengthOrRef === 'string' ? this.bufferToData(this.response[lengthOrRef as string]) as number : lengthOrRef || 1;
            this.response[name] = this.readData(buffer, offset, length);
            offset += length;
        });
    }

    private writeRequest(buffer: Buffer, offset: number): number {
        let initialOffset = offset;
        let needsRewrite = false;
        const tmpBuffer = Buffer.alloc(buffer.length);
        offset = 0;
        
        for (const i in this.structure.request) {
            const key: string = this.structure.request[i][0];
            let length: number | string = this.structure.request[i][1] || 1;
            const defaultValue: number | Buffer = this.structure.request[i][2] || 0;

            if (typeof length === 'string') {
                this.request[key] = this.request[key] || '';
                if (this.request[length] != this.request[key].length) {
                    this.request[length] = this.request[key].length;
                    needsRewrite = true;
                }
                length = parseInt(this.request[key].length);
            } else {
                this.request[key] = this.request[key] || defaultValue;
            }

            this.writeData(tmpBuffer, this.request[key], offset, length);

            offset += length;
        }
        if (needsRewrite) {
            this.writeRequest(tmpBuffer, 0);
        }
        tmpBuffer.copy(buffer, initialOffset, 0, offset);

        return offset;
    }

    private headerSync(processId: number, sessionId: number): Array<HeaderEntry> {
        return [
              ['ProtocolId',4,protocolId]
            , ['StructureSize',2,headerLength]
            , ['CreditCharge',2,0]
            , ['Status',4,0]
            , ['Command',2]
            , ['Credit',2,126]
            , ['Flags',4,0]
            , ['NextCommand',4,0]
            , ['MessageId',4]
            , ['MessageIdHigh',4,0]
            , ['ProcessId',4,processId]
            , ['TreeId',4,0]
            , ['SessionId',8,sessionId]
            , ['Signature',16,0]
          ];
    }

    private headerAsync(sessionId: number): Array<HeaderEntry> {
        return [
              ['ProtocolId',4,protocolId]
            , ['StructureSize',2,headerLength]
            , ['CreditCharge',2,0]
            , ['Status',4,0]
            , ['Command',2]
            , ['Credit',2,126]
            , ['Flags',4,0]
            , ['NextCommand',4,0]
            , ['MessageId',4]
            , ['MessageIdHigh',4,0]
            , ['AsyncId',8]
            , ['SessionId',8,sessionId]
            , ['Signature',16,0]
          ];
    }
}