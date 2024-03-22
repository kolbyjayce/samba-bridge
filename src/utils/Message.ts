import { getStatus, getErrorMessage } from "./ErrorReference";
import { BigInt } from "./BigInt";
import { Socket } from "net";

interface Response {
  // fix these later to be more accurate
  getHeaders: () => any;
  getResponse: () => any;
}

type Callback = (error: Error | null, result?: any) => void;

class Defaults {
  private successCode: string;

  constructor() {
    this.successCode = "STATUS_SUCCESS";
  }

  parse(connection: Socket, cb) {
    return (response) => {
      const header = response.getHeaders();
      const err = getStatus(BigInt.fromBuffer(header.status).toNumber());

      if (err.code === this.successCode) {
        // success
        cb?.(null, this.parseResponse?.(response));
      } else {
        const error = new Error(getErrorMessage(err));
        cb?.(error);
      }
    };
  }

  parseResponse?(response: Response) {
    return response.getResponse();
  }
}
