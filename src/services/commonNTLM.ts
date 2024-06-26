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

import { Buffer } from 'buffer';

function zeroextend(str: string, len: number): string {
  while (str.length < len)
    str = '0' + str;
  return str;
}

/*
 * Fix (odd) parity bits in a 64-bit DES key.
 */
function oddpar(buf: Buffer): Buffer {
  for (let j = 0; j < buf.length; j++) {
    let par = 1;
    for (let i = 1; i < 8; i++) {
      par = (par + ((buf[j] >> i) & 1)) % 2;
    }
    buf[j] |= par;
  }
  return buf;
}

/*
 * Expand a 56-bit key buffer to the full 64-bits for DES.
 *
 * Based on code sample in:
 *    http://www.innovation.ch/personal/ronald/ntlm.html
 */
function expandkey(key56: Buffer): Buffer {
  let key64 = Buffer.alloc(8);

  key64[0] = key56[0] & 0xFE;
  key64[1] = ((key56[0] << 7) & 0xFF) | (key56[1] >> 1);
  key64[2] = ((key56[1] << 6) & 0xFF) | (key56[2] >> 2);
  key64[3] = ((key56[2] << 5) & 0xFF) | (key56[3] >> 3);
  key64[4] = ((key56[3] << 4) & 0xFF) | (key56[4] >> 4);
  key64[5] = ((key56[4] << 3) & 0xFF) | (key56[5] >> 5);
  key64[6] = ((key56[5] << 2) & 0xFF) | (key56[6] >> 6);
  key64[7] = (key56[6] << 1) & 0xFF;

  return key64;
}

/*
 * Convert a binary string to a hex string
 */
function bintohex(bin: string | Buffer): string {
  let buf = Buffer.isBuffer(bin) ? bin : Buffer.from(bin, 'binary');
  let str = buf.toString('hex').toUpperCase();
  return zeroextend(str, 32);
}

export { zeroextend, oddpar, expandkey, bintohex };