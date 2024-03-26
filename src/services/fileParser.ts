interface ParsedFile {
    Index: number;
    CreationTime: Buffer;
    LastAccessTime: Buffer;
    LastWriteTime: Buffer;
    ChangeTime: Buffer;
    EndofFile: Buffer;
    AllocationSize: Buffer;
    FileAttributes: number;
    FilenameLength: number;
    EASize: number;
    ShortNameLength: number;
    FileId: Buffer;
    Filename: string;
}

function parseFiles(buffer: Buffer): ParsedFile[] {
    const files: ParsedFile[] = [];
    let offset = 0;
    let nextFileOffset = -1;
  
    while (nextFileOffset !== 0) {
        nextFileOffset = buffer.readUInt32LE(offset);
        files.push(
            parseFile(
                buffer.slice(offset + 4, nextFileOffset ? offset + nextFileOffset : buffer.length)
            )
        );
        offset += nextFileOffset;
    }
  
    return files;
}
  
  
function parseFile(buffer: Buffer): ParsedFile {
    let offset = 0;
      
    // The 'offset += variable' pattern increments 'offset' by 'variable' before using it.
    // This ensures the 'offset' points to the correct location in the buffer after each read.
    const file: ParsedFile = {
        Index: buffer.readUInt32LE(offset),
        CreationTime: buffer.slice((offset += 4), (offset += 8)),
        LastAccessTime: buffer.slice(offset, (offset += 8)),
        LastWriteTime: buffer.slice(offset, (offset += 8)),
        ChangeTime: buffer.slice(offset, (offset += 8)),
        EndofFile: buffer.slice(offset, (offset += 8)),
        AllocationSize: buffer.slice(offset, (offset += 8)),
        FileAttributes: buffer.readUInt32LE((offset += 8)),
        FilenameLength: buffer.readUInt32LE((offset += 4)),
        EASize: buffer.readUInt32LE((offset += 4)),
        ShortNameLength: buffer.readUInt8((offset += 4)),
        FileId: buffer.slice((offset += 1), (offset += 8)),
        Filename: buffer.slice(offset += 27, (offset += buffer.readUInt32LE(offset - 27))).toString('ucs2'),  // Assuming FilenameLength is handled here correctly
    };
  
    return file;
}

export { parseFiles };