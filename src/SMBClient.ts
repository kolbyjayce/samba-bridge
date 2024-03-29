import { SMBMessage } from "./SMBMessage/SMBMessage";
import * as messages from "./SMBMessage/MessageConstructor";
import { Socket } from "net";
import { SMB } from "./SMB";
import { IConnection } from "./types/Connection";
  
export class SMBClient {
    static async request(messageName: keyof typeof messages, params: any, connection: IConnection): Promise<SMBMessage> {
        const smbMessage = messages[messageName](connection, params);

        if (!smbMessage) {
            throw new Error(`Problem occurred while locating message type: ${messageName}`);
        }
    
        // Send the SMB message
        await this.sendNetBiosMessage(connection, smbMessage);
    
        // Wait for and handle the response
        const response = await this.getResponse(connection, smbMessage.getHeaders().MessageId);

        return await smbMessage.parse(connection, response);
    }

    static response(connection: IConnection, response: Buffer): void {
        if (!connection.responseBuffer) throw new Error("Buffer not allocated for the response.");
        connection.responseBuffer = Buffer.concat([connection.responseBuffer, response]);

        let extract = true;
        while (extract) {
            extract = false;
            if (connection.responseBuffer.length >= 4) {
                const msgLength = (connection.responseBuffer.readUInt8(1) << 16) + connection.responseBuffer.readUInt16BE(2);

                if (connection.responseBuffer.length >= 4) { // keep extracting
                    extract = true;
                    const res = connection.responseBuffer.subarray(4, msgLength + 4);
                    const message = new SMBMessage();

                    message.parseBuffer(res);

                    if (connection.debug) {
                        console.log("-----RESPONSE-----");
                        console.log(res.toString('hex'));
                    }

                    const mId = message.getHeaders().MessageId.toString('hex');

                    // if getResponse ran first, call the callback function with the message

                    if (connection.responsesCB[mId]) {
                        connection.responsesCB[mId](message);
                        delete connection.responsesCB[mId];
                    } else { // add message to responses object until getResponse runs
                        connection.responses[mId] = message;
                    }

                    connection.responseBuffer = connection.responseBuffer?.subarray(msgLength + 4);
                }
            }
        }
    }
    
    // Private functions
    private static getResponse(connection: IConnection, mId: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const messageId = Buffer.alloc(4);
            messageId.writeUInt32LE(mId, 0);

            const messageIdString = messageId.toString('hex');
    
            // check if response already received, otherwise wait for it
            if (messageIdString in connection.responses) {
                resolve(connection.responses[messageIdString]);
                delete connection.responses[messageIdString];
            } else {
                // Store resolve function to be called once the response is received
                console.log("Waiting for response for messageId:", messageIdString);
                connection.responsesCB[messageIdString] = (response: IConnection) => {
                    console.log("Received response for messageId:", messageIdString);
                    resolve(response);
                    delete connection.responsesCB[messageIdString]; // Clean up callback after execution
                };

                // Timeout to reject promise after 30 seconds
                const timeout = setTimeout(() => {
                    console.log("Timeout waiting for response for messageId:", messageIdString);
                    reject(new Error('Response timeout'));
                    delete connection.responsesCB[messageIdString];
                }, 30000);

                // cleanup timeout if response is received before timeout
                const originalCallback = connection.responsesCB[messageIdString];
                connection.responsesCB[messageIdString] = (response) => {
                    clearTimeout(timeout);
                    originalCallback(response);
                };            
            }
        })
    }

    private static async sendNetBiosMessage(connection: IConnection, message: SMBMessage): Promise<boolean> {
        const smbRequest = message.getBuffer(connection);

        if (connection.debug) {
            console.log("-----REQUEST------");
            console.log(smbRequest.toString('hex'));
        }

        const buffer = Buffer.alloc(smbRequest.length + 4);

        // write netbios call
        buffer.writeUint8(0x00, 0);

        // write message length
        buffer.writeUInt8((0xFF0000 & smbRequest.length) >> 16, 1);
        buffer.writeUInt16BE(0xFFFF & smbRequest.length, 2);

        // write message
        smbRequest.copy(buffer, 4, 0, smbRequest.length);

        return new Promise((resolve, reject) => {
            if (!connection.socket) {
                reject(new Error("Socket is not initialized."));
                return;
            }

            connection.socket.write(buffer, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            })
        });
    }
}