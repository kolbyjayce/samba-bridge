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

import { lmhashbuf, nthashbuf } from "./hashing";
import crypto from "crypto";
import { oddpar, expandkey } from "./commonNTLM";

const decodeType2 = (buffer: Buffer) => {
    const temp = buffer.toString('ascii', 0, 7);

    if (buffer[7] !== 0x00 || temp !== 'NTLMSSP') throw new Error("Error with decoding buffer.");

    const type = buffer.readUInt8(8);

    if (type !== 0x02) throw new Error("Message not NTLMSSP Challenge (0x02)");

    const nonce = buffer.subarray(24, 32);
    return nonce;
}

const encodeType3 = (username: string, hostname: string, ntdomain: string, nonce: Buffer, password: string): Buffer => {
    hostname = hostname.toUpperCase();
    ntdomain = ntdomain.toUpperCase();
  
    let lmh = Buffer.alloc(21);
    lmhashbuf(password).copy(lmh);
    lmh.fill(0x00, 16); // null pad to 21 bytes
    let nth = Buffer.alloc(21);
    nthashbuf(password).copy(nth);
    nth.fill(0x00, 16); // null pad to 21 bytes
  
    let lmr = makeResponse(lmh, nonce);
    let ntr = makeResponse(nth, nonce);
  
    let usernamelen = Buffer.byteLength(username, 'ucs2');
    let hostnamelen = Buffer.byteLength(hostname, 'ucs2');
    let ntdomainlen = Buffer.byteLength(ntdomain, 'ucs2');
    let lmrlen = 0x18;
    let ntrlen = 0x18;
  
    let ntdomainoff = 0x40;
    let usernameoff = ntdomainoff + ntdomainlen;
    let hostnameoff = usernameoff + usernamelen;
    let lmroff = hostnameoff + hostnamelen;
    let ntroff = lmroff + lmrlen;
  
    let msg_len = 64 + ntdomainlen + usernamelen + hostnamelen + lmrlen + ntrlen;
    let buf = Buffer.alloc(msg_len);
  
    buf.write('NTLMSSP', 0, 7, 'ascii'); // byte protocol[8];
    buf[7] = 0;
  
    buf[8] = 0x03; // byte type;
  
    buf.fill(0x00, 9, 12); // byte zero[3];
  
    buf.writeUInt16LE(lmrlen, 12); // short lm_resp_len;
    buf.writeUInt16LE(lmrlen, 14); // short lm_resp_len;
    buf.writeUInt16LE(lmroff, 16); // short lm_resp_off;
  
    buf.writeUInt16LE(ntrlen, 20); // short nt_resp_len;
    buf.writeUInt16LE(ntrlen, 22); // short nt_resp_len;
    buf.writeUInt16LE(ntroff, 24); // short nt_resp_off;
  
    buf.writeUInt16LE(ntdomainlen, 28); // short dom_len;
    buf.writeUInt16LE(ntdomainlen, 30); // short dom_len;
    buf.writeUInt16LE(ntdomainoff, 32); // short dom_off;
  
    buf.writeUInt16LE(usernamelen, 36); // short user_len;
    buf.writeUInt16LE(usernamelen, 38); // short user_len;
    buf.writeUInt16LE(usernameoff, 40); // short user_off;
  
    buf.writeUInt16LE(hostnamelen, 44); // short host_len;
    buf.writeUInt16LE(hostnamelen, 46); // short host_len;
    buf.writeUInt16LE(hostnameoff, 48); // short host_off;
  
    buf.writeUInt16LE(msg_len, 52); // short msg_len;
  
    buf.writeUInt16LE(0x8201, 56); // short flags;
  
    buf.write(ntdomain, ntdomainoff, 'ucs2');
    buf.write(username, usernameoff, 'ucs2');
    buf.write(hostname, hostnameoff, 'ucs2');
    lmr.copy(buf, lmroff);
    ntr.copy(buf, ntroff);
  
    return buf;
}

function makeResponse(hash: Buffer, nonce: Buffer): Buffer {
    let out = Buffer.alloc(24);
    for (let i = 0; i < 3; i++) {
      const keybuf = oddpar(expandkey(hash.slice(i * 7, i * 7 + 7)));
      // For DES-ECB, the IV parameter is not used but must be null or an empty buffer for createCipheriv
      const des = crypto.createCipheriv('DES-ECB', keybuf, Buffer.alloc(0));
      
      // Use the update method with Buffer directly without specifying encodings
      const str = des.update(nonce);
      
      // Copy the resulting buffer directly into the output buffer at the correct position
      str.copy(out, i * 8);
    }
    return out;
}

export { decodeType2, encodeType3 }