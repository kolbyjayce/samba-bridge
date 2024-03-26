import { getStatus, getErrorMessage } from "./ErrorReference";
import { BigInt } from "./BigInt";

class MessageDefaults {
    successCode = 'STATUS_SUCCESS';
    
    parse(connection: any, cb?: any) {
        return (response: any) => {
            const header = response.getHeaders();
            const err = getStatus(BigInt.fromBuffer(header.status).toNumber());

            if (err.code === this.successCode) {
                if (this.onSuccess) {
                    this.onSuccess(connection, response);
                }
                if (cb) {
                    cb(null, this.parseResponse(response));
                }
            } else {
                const error = new Error(getErrorMessage(err));
                if (cb) cb(error);                
            }
        }
    }

    parseResponse(response: any) {
        return response.getResponse();
    }

    onSuccess?(connection: any, response: any): void;
}

const message = (obj: any) => {
    const defaults = new MessageDefaults();

    Object.keys(defaults).forEach(key => {
        obj[key] = obj[key] || (defaults as any)[key];
    });
    return obj;
}

export default message;