import { Buffer } from "buffer";

// Custom Big int class for numbers larger than 2^53-1 (javascript limit)
// logic from https://github.com/bchelli/node-smb2/blob/master/lib/tools/bigint.js
export class BigInt {
  private buffer: Buffer;
  private sign: number;

  constructor(n: number | BigInt, v?: number) {
    if (BigInt.isBigInt(n)) {
      this.buffer = Buffer.alloc(n.buffer.length);
      n.buffer.copy(this.buffer);
      this.sign = n.sign;
    } else {
      this.buffer = Buffer.alloc(n);
      this.buffer.fill(0);
      this.sign = 1;

      v = v || 0;

      if (v !== 0) {
        if (v < 0) {
          this.sign = -1;
          v = -v;
        }

        let hex = v.toString(16);
        let size = Math.ceil(hex.length / 2);
        let carry = size * 2 - hex.length;

        for (let i = 0; i < size; i++) {
          let start = (size - i - 1) * 2 - carry;
          this.buffer.writeUInt8(
            parseInt(
              start === -1 ? hex.substr(0, 1) : hex.substr(start, 2),
              16,
            ),
            i,
          );
        }
      }
    }
  }

  static isBigInt(v: any): v is BigInt {
    return v instanceof BigInt;
  }

  static toBigInt(n: number, v?: number): BigInt {
    return new BigInt(n, v);
  }

  static fromBuffer(b: Buffer, sign: number = 1): BigInt {
    let bi = new BigInt(0);
    bi.sign = sign;
    bi.buffer = b;
    return bi;
  }

  add(v: BigInt | number): BigInt {
    if (!BigInt.isBigInt(v)) {
      v = BigInt.toBigInt(this.buffer.length, v as number);
    }

    if (this.sign !== v.sign) {
      // convert signs for correct addition
      return this.neg().sub(v);
    }

    let carry = 0;
    let n = Math.max(v.buffer.length, this.buffer.length);
    let result = new BigInt(n);

    for (let i = 0; i < n; i++) {
      let r =
        (i < this.buffer.length ? this.buffer.readUInt8(i) : 0) +
        (i < v.buffer.length ? v.buffer.readUInt8(i) : 0) +
        carry;
      result.buffer.writeUInt8(r & 0xff, i);
      carry = r >> 8;
    }

    result.sign = this.sign;

    return result;
  }

  neg(): BigInt {
    let result = new BigInt(this);
    result.sign *= -1;
    return result;
  }

  abs(): BigInt {
    let result = new BigInt(this);
    result.sign = 1;
    return result;
  }

  sub(v: BigInt | number): BigInt {
    if (!BigInt.isBigInt(v)) {
      v = BigInt.toBigInt(this.buffer.length, v as number);
    }

    if (this.sign !== v.sign) {
      return this.add(v.neg());
    }

    let carry = 0;
    let a = new BigInt(this);
    let b = new BigInt(v);
    let n = Math.max(a.buffer.length, b.buffer.length);
    let result = new BigInt(n);
    let sign = this.sign;

    if (a.abs().lt(b.abs())) {
      [a, b] = [b, a];
      sign *= -1;
    }

    for (let i = 0; i < n; i++) {
      let va = i < a.buffer.length ? a.buffer.readUInt8(i) : 0;
      let vb = i < b.buffer.length ? b.buffer.readUInt8(i) : 0;
      let c = 0;
      let r = va - vb - carry;

      while (r < 0) {
        r += 0xff;
        c--;
      }

      result.buffer.writeUInt8(r & 0xff, i);
      carry = (r >> 8) + c;
    }

    result.sign = sign;

    return result;
  }

  toBuffer(): Buffer {
    return this.buffer;
  }

  toNumber(): number {
    let b = Buffer.alloc(this.buffer.length);
    for (let i = 0; i < this.buffer.length; i++) {
      b.writeUInt8(this.buffer.readUInt8(this.buffer.length - i - 1), i);
    }
    return parseInt(b.toString("hex"), 16) * this.sign;
  }

  compare(v: BigInt | number): number {
    if (!BigInt.isBigInt(v)) {
      v = BigInt.toBigInt(this.buffer.length, v);
    }

    const n = Math.max(v.buffer.length, this.buffer.length);

    if (this.sign > v.sign) return 1;
    if (this.sign < v.sign) return -1;

    for (let i = n - 1; i >= 0; i--) {
      const a = i < this.buffer.length ? this.buffer.readUInt8(i) : 0;
      const b = i < v.buffer.length ? v.buffer.readUInt8(i) : 0;
      if (a !== b) {
        return a > b ? this.sign : -this.sign;
      }
    }

    return 0;
  }

  lt(v: BigInt | number): boolean {
    return this.compare(v) < 0;
  }

  le(v: BigInt | number): boolean {
    return this.compare(v) <= 0;
  }

  gt(v: BigInt | number): boolean {
    return this.compare(v) > 0;
  }

  ge(v: BigInt | number): boolean {
    return this.compare(v) >= 0;
  }
}
