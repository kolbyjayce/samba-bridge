import { Socket } from "net";

export interface IConnection {
    ip: string;
    share: string;
    port: number;
    messageId: number;
    fullPath: string;
    packetConcurrency: number;
    autoCloseTimeout: number;
    username: string;
    password: string;
    domain: string;
    SessionId: number;
    ProcessId: Buffer;
    debug: boolean
    connected: boolean;
    socket: Socket;
    errorHandler: Array<any>;
    responses: any;
    responsesCB: ResponseCallbacks;
    responseBuffer?: Buffer;
    TreeId?: any;
    nonce?: any;
    newResponse?: boolean;

}

interface ResponseCallbacks {
    [key: string]: (arg0: any) => any;
}