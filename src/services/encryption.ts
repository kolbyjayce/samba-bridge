import * as os from "os";
import { createLMv2Response, createNTLMHash, createNTLMv2Response, createPseudoRandomValue } from "./hashing";

export type NTLMType2Decoded = {
    flags: number;
    encoding: 'ascii' | 'ucs2';
    version: number;
    challenge: Buffer;
    targetName: string;
    targetInfo?: {
        parsed: parsedMessage;
        buffer: Buffer;
    };
};

interface parsedMessage {
    SERVER?: String;
    DOMAIN?: string;
    FQDN?: string;
    DNS?: string;
    PARENT_DNS?: string;
}

const NTLMSIGNATURE = 'NTLMSSP\0';
const flags = {
    NTLMFLAG_NEGOTIATE_OEM: 0x02,
    NTLMFLAG_NEGOTIATE_NTLM2_KEY: 0x04,
    NTLMFLAG_NEGOTIATE_TARGET_INFO: 0x08,
};

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

function decodeType2Message(buf: Buffer): NTLMType2Decoded {
    let obj: NTLMType2Decoded = {
        flags: 0,
        encoding: 'ascii',
        version: 1,
        challenge: Buffer.alloc(0),
        targetName: '',
    };

    // Check signature
    if (buf.toString('ascii', 0, NTLMSIGNATURE.length) !== NTLMSIGNATURE) {
        throw new Error('Invalid message signature');
    }

    // Check message type
    if (buf.readUInt32LE(NTLMSIGNATURE.length) !== 2) {
        throw new Error('Message was not NTLMSSP Challenge (0x02)');
    }

    // Read flags
    obj.flags = buf.readUInt32LE(20);
    obj.encoding = (obj.flags & flags.NTLMFLAG_NEGOTIATE_OEM) ? 'ascii' : 'ucs2';
    obj.version = (obj.flags & flags.NTLMFLAG_NEGOTIATE_NTLM2_KEY) ? 2 : 1;

    // Read challenge
    obj.challenge = buf.slice(24, 32);

    // Read target name
    let targetNameLength = buf.readUInt16LE(12);
    let targetNameOffset = buf.readUInt32LE(16);
    if (targetNameLength > 0) {
        obj.targetName = buf.toString(obj.encoding, targetNameOffset, targetNameOffset + targetNameLength);
    }

    // Read target info
    let targetInfoLength = buf.readUInt16LE(40);
    let targetInfoOffset = buf.readUInt32LE(44);
    let targetInfoBuffer = buf.slice(targetInfoOffset, targetInfoOffset + targetInfoLength);

    obj.targetInfo = {
        parsed: parseTargetInfo(targetInfoBuffer, obj.encoding),
        buffer: targetInfoBuffer
    };

    return obj;
}

function createType3Message(
    type2Message: NTLMType2Decoded,
    username: string,
    password: string,
    workstation: string = os.hostname(),
    target: string = ''
): Buffer {
    let dataPos = 52;
    const buf = Buffer.alloc(1024);

    target = target || type2Message.targetName;
    username = username.toUpperCase();

    // Signature
    buf.write(NTLMSIGNATURE, 0, NTLMSIGNATURE.length, 'ascii');

    // Message type
    buf.writeUInt32LE(3, 8);

    
    if (type2Message.version !== 2) throw new Error("NTLM Version 1 is not supported. Please check with your domain administrator to upgrade.");
    
    dataPos = 64;
    
    const ntlmHash = createNTLMHash(password);
    const nonce = createPseudoRandomValue(16);
    const lmv2 = createLMv2Response(type2Message, username, ntlmHash, nonce, target);
    const ntlmv2 = createNTLMv2Response(type2Message, username, ntlmHash, nonce, target);

    // lmv2 security buffer
    buf.writeUInt16LE(lmv2.length, 12);
    buf.writeUInt16LE(lmv2.length, 14);
    buf.writeUInt32LE(dataPos, 16);

    lmv2.copy(buf, dataPos);
    dataPos += lmv2.length;

    // ntlmv2 buffer
    buf.writeUInt16LE(ntlmv2.length, 20);
    buf.writeUInt16LE(ntlmv2.length, 22);
    buf.writeUInt32LE(dataPos, 24);

    ntlmv2.copy(buf, dataPos);
    dataPos += ntlmv2.length;

	//target name security buffer
	buf.writeUInt16LE(type2Message.encoding === 'ascii' ? target.length : target.length * 2, 28);
	buf.writeUInt16LE(type2Message.encoding === 'ascii' ? target.length : target.length * 2, 30);
	buf.writeUInt32LE(dataPos, 32);

	dataPos += buf.write(target, dataPos, type2Message.encoding);

	//user name security buffer
	buf.writeUInt16LE(type2Message.encoding === 'ascii' ? username.length : username.length * 2, 36);
	buf.writeUInt16LE(type2Message.encoding === 'ascii' ? username.length : username.length * 2, 38);
	buf.writeUInt32LE(dataPos, 40);

	dataPos += buf.write(username, dataPos, type2Message.encoding);

	//workstation name security buffer
	buf.writeUInt16LE(type2Message.encoding === 'ascii' ? workstation.length : workstation.length * 2, 44);
	buf.writeUInt16LE(type2Message.encoding === 'ascii' ? workstation.length : workstation.length * 2, 46);
	buf.writeUInt32LE(dataPos, 48);

	dataPos += buf.write(workstation, dataPos, type2Message.encoding);

    //session key security buffer
    buf.writeUInt16LE(0, 52);
    buf.writeUInt16LE(0, 54);
    buf.writeUInt32LE(0, 56);

    //flags
    buf.writeUInt32LE(type2Message.flags, 60);

    return buf.subarray(0, dataPos);
}


export { encodeType1, decodeType2Message, createType3Message }

/** HELPER FUNCTIONS */

function parseTargetInfo(buffer: Buffer, encoding: 'ascii' | 'ucs2'): parsedMessage {
    let info: parsedMessage = {};
    let pos = 0;

    while (pos < buffer.length) {
        let blockType = buffer.readUInt16LE(pos);
        pos += 2;
        let blockLength = buffer.readUInt16LE(pos);
        pos += 2;

        if (blockType === 0) break; // Terminator block

        let blockData = buffer.toString(encoding, pos, pos + blockLength);
        pos += blockLength;

        switch (blockType) {
            case 1: info.SERVER = blockData; break;
            case 2: info.DOMAIN = blockData; break;
            case 3: info.FQDN = blockData; break;
            case 4: info.DNS = blockData; break;
            case 5: info.PARENT_DNS = blockData; break;
        }
    }

    return info;
}