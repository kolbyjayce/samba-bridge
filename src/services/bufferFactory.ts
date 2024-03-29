const unsignedNumberToBuffer = (num: number): Buffer => {
    if (num < 2 ** 8) {
        let buffer = Buffer.alloc(1);
        buffer.writeUInt8(num);
        return buffer;
    } else if (num < 2 ** 16) {
        let buffer = Buffer.alloc(2);
        buffer.writeUInt16LE(num);
        return buffer;
    } else if (num < 2 ** 32) {
        let buffer = Buffer.alloc(4);
        buffer.writeUInt32LE(num);
        return buffer;
    } else {
        throw new Error("Number too large for 32-bit unsigned integer");
    }
}

export { unsignedNumberToBuffer };