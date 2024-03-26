import { IStructureOptions } from "../types/Structures";

export const structures: IStructureOptions = {
  negotiate: {
    request: [
      ["StructureSize", 2, 36],
      ["DialectCount", 2, 2],
      ["SecurityMode", 2, 1],
      ["Reserved", 2, 0],
      ["Capabilities", 4, 0],
      ["ClientGuid", 16, 0],
      ["ClientStartTime", 8, 0],
      ["Dialects", 4, new Buffer([0x02, 0x02, 0x10, 0x02])],
    ],
    response: [
      ["StructureSize", 2],
      ["SecurityMode", 2],
      ["DialectRevision", 2],
      ["Reserved", 2],
      ["ServerGuid", 16],
      ["Capabilities", 4],
      ["MaxTransactSize", 4],
      ["MaxReadSize", 4],
      ["MaxWriteSize", 4],
      ["SystemTime", 8],
      ["ServerStartTime", 8],
      ["SecurityBufferOffset", 2],
      ["SecurityBufferLength", 2],
      ["Reserved2", 4],
      ["Buffer", "SecurityBufferLength"],
    ],
  },
  session_setup: {
    request: [
      ["StructureSize", 2, 25],
      ["Flags", 1, 0],
      ["SecurityMode", 1, 1],
      ["Capabilities", 4, 1],
      ["Channel", 4, 0],
      ["SecurityBufferOffset", 2, 88],
      ["SecurityBufferLength", 2],
      ["PreviousSessionId", 8, 0],
      ["Buffer", "SecurityBufferLength"],
    ],
    response: [
      ["StructureSize", 2],
      ["SessionFlags", 2],
      ["SecurityBufferOffset", 2],
      ["SecurityBufferLength", 2],
      ["Buffer", "SecurityBufferLength"],
    ],
  },
  close: {
    request: [
      ["StructureSize", 2, 24],
      ["Flags", 2, 0],
      ["Reserved", 4, 0],
      ["FileId", 16],
    ],

    response: [
      ["StructureSize", 2],
      ["Flags", 2],
      ["Reserved", 4],
      ["CreationTime", 8],
      ["LastAccessTime", 8],
      ["LastWriteTime", 8],
      ["ChangeTime", 8],
      ["AllocationSize", 8],
      ["EndofFile", 8],
      ["FileAttributes", 4],
    ],
  },
  create: {
    request: [
      ["StructureSize", 2, 57],
      ["SecurityFlags", 1, 0],
      ["RequestedOplockLevel", 1, 0],
      ["ImpersonationLevel", 4, 0x00000002],
      ["SmbCreateFlags", 8, 0],
      ["Reserved", 8, 0],
      ["DesiredAccess", 4, 0x00100081],
      ["FileAttributes", 4, 0x00000000],
      ["ShareAccess", 4, 0x00000007],
      ["CreateDisposition", 4, 0x00000001],
      ["CreateOptions", 4, 0x00000020],
      ["NameOffset", 2],
      ["NameLength", 2],
      ["CreateContextsOffset", 4],
      ["CreateContextsLength", 4],
      ["Buffer", "NameLength"],
      ["Reserved2", 2, 0x4200],
      ["CreateContexts", "CreateContextsLength", ""],
    ],
    response: [
      ["StructureSize", 2],
      ["OplockLevel", 1],
      ["Flags", 1],
      ["CreateAction", 4],
      ["CreationTime", 8],
      ["LastAccessTime", 8],
      ["LastWriteTime", 8],
      ["ChangeTime", 8],
      ["AllocationSize", 8],
      ["EndofFile", 8],
      ["FileAttributes", 4],
      ["Reserved2", 4],
      ["FileId", 16],
      ["CreateContextsOffset", 4],
      ["CreateContextsLength", 4],
      ["Buffer", "CreateContextsLength"],
    ],
  },
  query_directory: {
    request: [
      ["StructureSize", 2, 33],
      ["FileInformationClass", 1, 0x25], // FileBothDirectoryInformation plus volume file ID about a file or directory.
      ["Flags", 1, 0],
      ["FileIndex", 4, 0],
      ["FileId", 16],
      ["FileNameOffset", 2, 96],
      ["FileNameLength", 2],
      ["OutputBufferLength", 4, 0x00010000],
      ["Buffer", "FileNameLength"],
    ],

    response: [
      ["StructureSize", 2],
      ["OutputBufferOffset", 2],
      ["OutputBufferLength", 4],
      ["Buffer", "OutputBufferLength"],
    ],
  },
  read: {
    request: [
      ["StructureSize", 2, 49],
      ["Padding", 1, 0x50],
      ["Flags", 1, 0],
      ["Length", 4],
      ["Offset", 8],
      ["FileId", 16],
      ["MinimumCount", 4, 0],
      ["Channel", 4, 0],
      ["RemainingBytes", 4, 0],
      ["ReadChannelInfoOffset", 2, 0],
      ["ReadChannelInfoLength", 2, 0],
      ["Buffer", 1, 0],
    ],

    response: [
      ["StructureSize", 2],
      ["DataOffset", 1],
      ["Reserved", 1],
      ["DataLength", 4],
      ["DataRemaining", 4],
      ["Reserved2", 4],
      ["Buffer", "DataLength"],
    ],
  },
  set_info: {
    request: [
      ["StructureSize", 2, 33],
      ["InfoType", 1, 1],
      ["FileInfoClass", 1],
      ["BufferLength", 4],
      ["BufferOffset", 2, 0x0060],
      ["Reserved", 2, 0],
      ["AdditionalInformation", 4, 0],
      ["FileId", 16],
      ["Buffer", "BufferLength"],
    ],

    response: [["StructureSize", 2]],
  },
  tree_connect: {
    request: [
      ["StructureSize", 2, 9],
      ["Reserved", 2, 0],
      ["PathOffset", 2, 72],
      ["PathLength", 2],
      ["Buffer", "PathLength"],
    ],

    response: [
      ["StructureSize", 2],
      ["ShareType", 1],
      ["Reserved", 1],
      ["ShareFlags", 4],
      ["Capabilities", 4],
      ["MaximalAccess", 4],
    ],
  },
  write: {
    request: [
      ["StructureSize", 2, 49],
      ["DataOffset", 2, 0x70],
      ["Length", 4, 0],
      ["Offset", 8],
      ["FileId", 16],
      ["Channel", 4, 0],
      ["RemainingBytes", 4, 0],
      ["WriteChannelInfoOffset", 2, 0],
      ["WriteChannelInfoLength", 2, 0],
      ["Flags", 4, 0],
      ["Buffer", "Length"],
    ],

    response: [
      ["StructureSize", 2],
      ["Reserved", 2],
      ["Count", 4],
      ["Remaining", 4],
      ["WriteChannelInfoOffset", 2],
      ["WriteChannelInfoLength", 2],
    ],
  },
};