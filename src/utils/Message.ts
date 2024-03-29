import { getStatus, getErrorMessage } from "./ErrorReference";
import { BigInt } from "./BigInt";
import { IConnection } from "../types/Connection";
import { SMBMessage } from "../SMBMessage/SMBMessage";

export class MessageDefaults {
    successCode = 'STATUS_SUCCESS';

    public parse(connection: IConnection, message: SMBMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            const header = message.getHeaders();

            const err = getStatus(BigInt.fromBuffer(header.Status).toNumber());
    
            if (err.code === this.successCode) {
                if (this.onSuccess) {
                    this.onSuccess(connection, message);
                }
                resolve(this.parseResponse(message));
            } else {
                const error = new Error(getErrorMessage(err));
                reject(error);
            }
        })
    }

    parseResponse(response: any) {
        return response.getResponse();
    }

    onSuccess?(connection: any, response: any): void;
}