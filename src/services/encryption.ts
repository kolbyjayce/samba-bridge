/*
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * Copyright (C) 2012  Joshua M. Clulow <josh@sysmgr.org>
 */

// import { lmhashbuf, nthashbuf } from "./hashing";
import crypto from "crypto";
import * as os from "os";
import { createLMv2Response, createNTLMHash, createPseudoRandomValue } from "./hashing";

const encodeType1 = (hostname: string, domain: string) => {
    hostname = hostname.toUpperCase();
    domain = domain.toUpperCase();

    const hostnameLength = Buffer.byteLength(hostname, 'ascii');
    const domainLength = Buffer.byteLength(domain, 'ascii');

    let pos = 0;
    const buf = Buffer.alloc(32 + hostnameLength + domainLength);

    buf.write('NTLMSSP', pos, 7, 'ascii');
    pos += 7;

    buf.writeUInt8(0, pos);
    pos++;
  
    buf.writeUInt8(0x01, pos); // byte type;
    pos++;
  
    buf.fill(0x00, pos, pos + 3); // byte zero[3];
    pos += 3;
  
    buf.writeUInt16LE(0xb203, pos); // short flags;
    pos += 2;
  
    buf.fill(0x00, pos, pos + 2); // byte zero[2];
    pos += 2;
  
    buf.writeUInt16LE(domainLength, pos); // short dom_len;
    pos += 2;
    
    buf.writeUInt16LE(domainLength, pos); // short dom_len;
    pos += 2;

    const domainOff = 0x20 + hostnameLength;
    buf.writeUInt16LE(domainOff, pos); // short dom_off;
    pos += 2;

    buf.fill(0x00, pos, pos + 2); // byte zero[2];
    pos += 2;
  
    buf.writeUInt16LE(hostnameLength, pos); // short host_len;
    pos += 2;
    buf.writeUInt16LE(hostnameLength, pos); // short host_len;
    pos += 2;
  
    buf.writeUInt16LE(0x20, pos); // short host_off;
    pos += 2;
  
    buf.fill(0x00, pos, pos + 2); // byte zero[2];
    pos += 2;
  
    buf.write(hostname, 0x20, hostnameLength, 'ascii');
    buf.write(domain, domainOff, domainLength, 'ascii');
  
    return buf;
}

// function encodeType3(username: string, password: string, hostname: string, ntdomain: string, challenge: Buffer, workstation: string): Buffer {
//     let dataPos = 52;
//     const buf = Buffer.alloc(1024);

//     if (!workstation) {
//         workstation = os.hostname();
//     }

//     const signature = "NTLMSSP\0"
//     buf.write(signature, 0, signature.length, 'ascii');

//     buf.writeUInt32LE(3, 8); // set message type

//     dataPos = 64;

//     let ntlmHash = createNTLMHash(password),
//         nonce = createPseudoRandomValue(16),
//         lmv2 = createLMv2Response(challenge, username, ntlmHash, nonce, target),
//         ntlmv2 = hash.createNTLMv2Response(type2Message, username, ntlmHash, nonce, target);

//     //lmv2 security buffer
//     buf.writeUInt16LE(lmv2.length, 12);
//     buf.writeUInt16LE(lmv2.length, 14);
//     buf.writeUInt32LE(dataPos, 16);

//     lmv2.copy(buf, dataPos);
//     dataPos += lmv2.length;
    
//     //ntlmv2 security buffer
//     buf.writeUInt16LE(ntlmv2.length, 20);
//     buf.writeUInt16LE(ntlmv2.length, 22);
//     buf.writeUInt32LE(dataPos, 24);

//     ntlmv2.copy(buf, dataPos);
//     dataPos += ntlmv2.length;
// }

export { encodeType1 }

/** HELPER FUNCTIONS */

function createHmacMd5(key: Buffer, data: Buffer): Buffer {
    return crypto.createHmac('md5', key).update(data).digest();
}

function ntHash(input: string): Buffer {
    return crypto.createHash('md4').update(Buffer.from(input, 'utf16le')).digest();
}

function ntowfv2(password: string, username: string, domain: string): Buffer {
    const userDomain = Buffer.from(username.toUpperCase() + domain, 'utf16le');
    return createHmacMd5(ntHash(password), userDomain);
}

function generateNTLMv2Blob(serverChallenge: Buffer, clientChallenge: Buffer, domain: string, username: string): Buffer {
    const timestamp = getCurrentTimeForNTLM();
    // Assuming Blob starts with a signature, a reserved field, timestamp, challenges, and ends with domain name information
    // Signature: 0x01010000, Reserved: 0x00000000, Timestamp, Challenge, Domain
    // This part is highly simplified and needs to include all parts of the blob as per NTLMv2 specifications
    const blobSignature = Buffer.from('01010000', 'hex');
    const reserved = Buffer.alloc(4, 0);
    const domainNameBuffer = Buffer.from(domain.toUpperCase(), 'utf16le');
    const blob = Buffer.concat([blobSignature, reserved, timestamp, clientChallenge, reserved, domainNameBuffer]); // Simplified
    return blob;
}

function generateNTLMv2Response(serverChallenge: Buffer, password: string, username: string, domain: string): Buffer {
    const v2Hash = ntowfv2(password, username, domain);
    const clientChallenge = crypto.randomBytes(8);
    const blob = generateNTLMv2Blob(serverChallenge, clientChallenge, domain, username);
    return createHmacMd5(v2Hash, Buffer.concat([serverChallenge, blob]));
}

function getCurrentTimeForNTLM(): Buffer {
    const ntEpoch = BigInt(Date.UTC(1601, 0, 1));
    const unixEpoch = BigInt(Date.UTC(1970, 0, 1));
    const time = (BigInt(Date.now()) + (unixEpoch - ntEpoch)) * BigInt(10000);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(time);
    return buffer;
}