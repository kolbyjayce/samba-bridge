import * as net from "net";
import { SMBClient } from "./SMBClient";
import { SMB } from "./SMB";

export class SMBConnection {
    static close(connection: any) {
        this.clearAutoCloseTimeout(connection);
        if (connection.connected) {
            connection.connected = false;
            connection.socket.end();
        };
    }

    static requireConnect(method: any): () => void {
        return () => {
            // const connection = this;
            const args = Array.prototype.slice.call(arguments);
            this.connect(this, (err: any) => {
                const cb = args.pop();
                cb.scheduledAutoClose(this, cb);
                args.push(cb);

                if (err) {
                    cb(err);
                } else {
                    method.apply(this, args);
                }
            })
        };
    }

    static init(connection: SMB) {
        connection.connected = false;
        connection.socket = new net.Socket({ allowHalfOpen: true });

        connection.socket.on('data', SMBClient.response(connection as any));

        connection.errorHandler = [];

        connection.socket.on('error', (err: any) => {
            if (connection.errorHandler.length > 0) {
                connection.errorHandler[0].call(null, err)
            }
            if (connection.debug) {
                console.error("-----ERROR-----");
                console.log(arguments);
            }
        });
    }

    static connect(connection: any, cb: any) {
        if (connection.connected) {
            cb && cb(null);
            return;
        }

        cb = this.scheduleAutoClose(connection, cb);

        connection.socket.connect(connection.port, connection.ip);

        SMBClient.request('negotiate', {}, connection, (err) => {
            if (err) {
                cb && cb(err)
            } else {
                SMBClient.request('session_setup_step1', {}, connection, (err) => {
                    if (err) {
                        cb && cb(err);
                    } else {
                        SMBClient.request('session_setup_step2', {}, connection, (err) => {
                            if (err) {
                                cb && cb(err);
                            } else {
                                SMBClient.request('tree_connect', {}, connection, (err) => {
                                    if (err) {
                                        cb && cb(err);
                                    } else {
                                        connection.connected = true;
                                        cb && cb(null);
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }

    // Private Functions
    private static clearAutoCloseTimeout(connection: any) {
        if (connection.autoCloseTimeout) {
            clearTimeout(connection.scheduledAutoClose);
            connection.scheduledAutoClose = null;
        }
    }

    private static setAutoCloseTimeout(connection: any): void {
        this.clearAutoCloseTimeout(connection);
        if (connection.autoCloseTimeout != 0) {
            connection.scheduledAutoClose = setTimeout(() => {
                connection.close();
            }, connection.autoCloseTimeout);
        }
    }

    private static scheduleAutoClose(connection: any, cb: any): () => any {
        this.addErrorListener(connection, cb);
        this.clearAutoCloseTimeout(connection);

        return () => {
            this.removeErrorListener(connection);
            this.setAutoCloseTimeout(connection);
            cb.apply(null, arguments);
        };
    }

    // private error handlers
    private static addErrorListener(connection: any, callback: any): void {
        console.log(connection.errorHandler);
        connection.errorHandler.unshift(callback);
    }

    private static removeErrorListener(connection: any): void {
        connection.errorHandler.shift();
    }
}