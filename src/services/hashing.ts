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
 * Copyright (C) 2011-2012  Joshua M. Clulow <josh@sysmgr.org>
 */

import crypto from 'crypto';
import * as $ from './commonNTLM';

/*
 * Generate the LM Hash
 */
function lmhashbuf(inputstr: string): Buffer {
  /* ASCII --> uppercase */
  const x = inputstr.substring(0, 14).toUpperCase();
  const xl = Buffer.byteLength(x, 'ascii');

  /* null pad to 14 bytes */
  let y = Buffer.alloc(14);
  y.write(x, 0, xl, 'ascii');
  y.fill(0, xl);

  /* insert odd parity bits in key */
  const halves = [
    $.oddpar($.expandkey(y.slice(0, 7))),
    $.oddpar($.expandkey(y.slice(7, 14)))
  ];

  /* DES encrypt magic number "KGS!@#$%" to two
   * 8-byte ciphertexts, (ECB, no padding)
   */
  let buf = Buffer.alloc(16);
  let pos = 0;
  halves.forEach(function(z) {
    const des = crypto.createCipheriv('DES-ECB', z, null); // In modern Node.js versions, the IV parameter can be null for ECB mode
    const str = des.update('KGS!@#$%', 'binary', 'binary') + des.final('binary');
    buf.write(str, pos, 8, 'binary');
    pos += 8;
  });

  return buf;
}

function nthashbuf(str: string): Buffer {
  /* take MD4 hash of UCS-2 encoded password */
  let ucs2 = Buffer.from(str, 'ucs2');
  const md4 = crypto.createHash('md4'); // Note: MD4 is considered insecure and might not be supported in all environments
  md4.update(ucs2);
  return Buffer.from(md4.digest('binary'), 'binary');
}

function lmhash(is: string): string {
  return $.bintohex(lmhashbuf(is));
}

function nthash(is: string): string {
  return $.bintohex(nthashbuf(is));
}

export { nthashbuf, lmhashbuf, nthash, lmhash };
