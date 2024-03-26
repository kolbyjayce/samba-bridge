import { SMBMessage } from "./SMBMessage/SMBMessage";
import * as messages from "./SMBMessage/MessageConstructor";
import { Socket } from "net";
import { SMB } from "./SMB";
  
export class SMBClient {
    static request(messageName: keyof typeof messages, params: any, connection: SMB, cb: (message?: SMBMessage, error?: Error) => void) {
        const msg = messages[messageName];
        const smbMessage = msg.generate(connection, params);
    
        // Send the SMB message
        this.sendNetBiosMessage(connection, smbMessage);
    
        // Wait for and handle the response
        this.getResponse(connection, smbMessage.getHeaders().MessageId, msg.parse(connection, cb));
    }

    static response(connection: any) {
        connection.responses = {};
        connection.responsesCB = {};
        connection.responseBuffer = Buffer.alloc(0);
    
        return (response: Buffer) => {
            // Concatenate new response with the existing buffer
            connection.responseBuffer = Buffer.concat([connection.responseBuffer, response]);
        
            // Extract complete messages
            let extract = true;
            while (extract) {
                extract = false;
        
                // Check if the buffer has at least the header size (4 bytes for NetBIOS)
                if (connection.responseBuffer.length >= 4) {
                    // Message length is in the NetBIOS header; 1 byte for type + 3 bytes for length
                    const msgLength = (connection.responseBuffer.readUInt8(1) << 16) + connection.responseBuffer.readUInt16BE(2);
            
                    // Check if the complete message is received (message length + 4 bytes header)
                    if (connection.responseBuffer.length >= msgLength + 4) {
                        extract = true;
            
                        // Parse the SMB2 message from the buffer
                        const messageBuffer = connection.responseBuffer.slice(4, msgLength + 4);
                        const message = new SMBMessage();
                        message.parseBuffer(messageBuffer);
            
                        // Optionally log the response
                        if (connection.debug) {
                        console.log('--response');
                        console.log(messageBuffer.toString('hex'));
                        }
            
                        // Get the message ID as a hex string
                        const mId = message.getHeaders().MessageId.toString('hex');
            
                        // Dispatch the message if a callback is waiting, or store it
                        if (connection.responsesCB[mId]) {
                        connection.responsesCB[mId](message);
                        delete connection.responsesCB[mId];
                        } else {
                        connection.responses[mId] = message;
                        }
            
                        // Remove the processed message from the response buffer
                        connection.responseBuffer = connection.responseBuffer.slice(msgLength + 4);
                    }
                }
            }
        };
    }

    // Private functions
    private static sendNetBiosMessage(connection: any, message: SMBMessage): boolean {
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

        // Send message through socket
        connection.newResponse = false;
        connection.socket.write(buffer);

        return true;
    }

    private static getResponse(connection: any, mId: number, cb: any) {
        const messageId = Buffer.alloc(4);
        messageId.writeUInt32LE(mId, 0);
        const messageIdString = messageId.toString('hex');

        if (messageIdString in connection.responses) {
            cb(connection.responses[messageIdString]);
            delete connection.responses[messageIdString];
        } else {
            connection.responsesCB[messageIdString] = cb;
        }
    }
}