import crypto from "crypto";
import { NTLMType2Decoded } from "./encryption";

const createNTLMHash = (password: string): Buffer => {
    let md4sum = crypto.createHash('md4');
    md4sum.update(Buffer.from(password, 'ucs2'));
    return md4sum.digest();
}

const createPseudoRandomValue = (length: number): string => {
	let str = '';
	while (str.length < length) {
		str += Math.floor(Math.random() * 16).toString(16);
	}
	return str;
}

function createLMv2Response(type2Message: NTLMType2Decoded, username: string, ntlmhash: Buffer, nonce: string, targetName: string): Buffer {
    const buf = Buffer.alloc(24);
    const ntlm2hash = createNTLMv2Hash(ntlmhash, username, targetName);
    const hmac = crypto.createHmac('md5', ntlm2hash);

    // Server challenge
    type2Message.challenge.copy(buf, 0);

    // Client nonce
    buf.write(nonce || createPseudoRandomValue(16), 16, 'hex');

    // Create hash
    hmac.update(buf.subarray(8)); 
    const hashedBuffer = hmac.digest();

    hashedBuffer.copy(buf);

    return buf;
}

function createNTLMv2Response(
    type2message: NTLMType2Decoded,
    username: string,
    ntlmhash: Buffer,
    nonce: string,
    targetName: string
  ): Buffer {
    if (!type2message.targetInfo) throw new Error("Target info was not provided in the type2message response")
	let buf = new Buffer(48 + type2message.targetInfo.buffer.length),
		ntlm2hash = createNTLMv2Hash(ntlmhash, username, targetName),
		hmac = crypto.createHmac('md5', ntlm2hash);

	//the first 8 bytes are spare to store the hashed value before the blob

	//server challenge
	type2message.challenge.copy(buf, 8);

	//blob signature
	buf.writeUInt32BE(0x01010000, 16);

	//reserved
	buf.writeUInt32LE(0, 20);

	//timestamp
	//TODO: we are loosing precision here since js is not able to handle those large integers
	// maybe think about a different solution here
	// 11644473600000 = diff between 1970 and 1601
	let timestamp = ((Date.now() + 11644473600000) * 10000).toString(16);
	let timestampLow = Number('0x' + timestamp.substring(Math.max(0, timestamp.length - 8)));
	let timestampHigh = Number('0x' + timestamp.substring(0, Math.max(0, timestamp.length - 8)));

	buf.writeUInt32LE(timestampLow, 24);
	buf.writeUInt32LE(timestampHigh, 28);

	//random client nonce
	buf.write(nonce || createPseudoRandomValue(16), 32, 'hex');

	//zero
	buf.writeUInt32LE(0, 40);

	//complete target information block from type 2 message
	type2message.targetInfo.buffer.copy(buf, 44);

	//zero
	buf.writeUInt32LE(0, 44 + type2message.targetInfo.buffer.length);

	hmac.update(buf.slice(8));
	let hashedBuffer = hmac.digest();

	hashedBuffer.copy(buf);

	return buf;
  }

const createNTLMv2Hash = (ntlmHash: Buffer, username: string, authTargetName: string): Buffer => {
    const hmac = crypto.createHmac('md5', ntlmHash);
    hmac.update(Buffer.from(username.toUpperCase() + authTargetName, 'ucs2'));
    return hmac.digest();
}

export { createNTLMHash, createPseudoRandomValue, createLMv2Response, createNTLMv2Response }