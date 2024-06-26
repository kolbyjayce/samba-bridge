import { SMBMessage } from "./SMBMessage"
import { parseFiles } from "../services/fileParser";
import { IConnection } from "../types/Connection";
import { createType3Message, decodeType2Message, encodeType1 } from "../services/encryption";


const close = (connection: IConnection, params: any) => {
    new SMBMessage({
        headers: {
            "Command": "CLOSE"
            , "SessionId": connection.SessionId
            , "TreeId": connection.TreeId
            , "ProcessId": connection.ProcessId
        }
        , request: {
            "FileId": params.FileId
        }
    });
};


const create_folder = (connection: IConnection, params: any) => {
    const buffer = Buffer.alloc(params.path, 'ucs2');

    return new SMBMessage({
        headers:{
            'Command':'CREATE'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
            }
        , request:{
            'Buffer':buffer
            , 'DesiredAccess':0x001701DF
            , 'FileAttributes':0x00000000
            , 'ShareAccess':0x00000000
            , 'CreateDisposition':0x00000002
            , 'CreateOptions':0x00000021
            , 'NameOffset':0x0078
            , 'CreateContextsOffset':0x007A+buffer.length
            }
    });
};

const create = (connection: IConnection, params: any) => {
    const buffer = Buffer.alloc(params.path, 'usc2');

    return new SMBMessage({
        headers: {
            'Command':'CREATE'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request: {
            'Buffer':buffer
            , 'DesiredAccess':0x001701DF
            , 'FileAttributes':0x00000080
            , 'ShareAccess':0x00000000
            , 'CreateDisposition':0x00000005
            , 'CreateOptions':0x00000044
            , 'NameOffset':0x0078
            , 'CreateContextsOffset':0x007A+buffer.length
        }
    });
};

const negotiate = (connection: IConnection, params?: any) => {
    return new SMBMessage({
        headers: {
            'Command':'NEGOTIATE'
            , 'ProcessId':connection.ProcessId
        }
    });
};

const open_folder = (connection: IConnection, params: any) =>{
    const buffer = Buffer.alloc(params.path, 'usc2');

    return new SMBMessage({
        headers: {
            'Command':'CREATE'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request: {
            'Buffer':buffer
            , 'FileAttributes':0x00000000
            , 'ShareAccess':0x00000007
            , 'CreateDisposition':0x00000001
            , 'CreateOptions':0x00200021
            , 'NameOffset':0x0078
            , 'CreateContextsOffset':0x007A+buffer.length
        }
    });
};

const open = (connection: IConnection, params: any) => {
    const buffer = Buffer.alloc(params.path, 'usc2');

    return new SMBMessage({
        headers:{
            'Command':'CREATE'  
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request:{
            'Buffer':buffer
            , 'DesiredAccess':0x001701DF
            , 'NameOffset':0x0078
            , 'CreateContextsOffset':0x007A+buffer.length
        }
    });
};

const query_directory = (connection: IConnection, params: any) => {
    return new SMBMessage({
        headers:{
            'Command':'QUERY_DIRECTORY'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request:{
            'FileId':params.FileId
            , 'Buffer': Buffer.from('*', 'ucs2')
        }
        , parseResponse(response: any) { return parseFiles(response.getResponse().Buffer); }
    })
};

const read = (connection: IConnection, file: any) => {
    return new SMBMessage({
        headers:{
            'Command':'READ'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request:{
            'FileId':file.FileId
            , 'Length':file.Length
            , 'Offset':file.Offset
        }
        , parseResponse(response: any) { return response.getResponse().Buffer; }
    });
};

const session_setup_step1 = (connection: IConnection, params?: any) => {
    return new SMBMessage({
        headers:{
            'Command':'SESSION_SETUP'
            ,'ProcessId':connection.ProcessId
        }
        , request:{
            'Buffer': encodeType1(
                connection.ip
                ,connection.domain
            )
        }
        , successCode: 'STATUS_MORE_PROCESSING_REQUIRED'
        , onSuccess(connection: IConnection, response: any) {
            try {
                const type2MessageBuffer = response.getResponse().Buffer;
                const decodedType2Message = decodeType2Message(type2MessageBuffer);

                connection.Type2Message = decodedType2Message;

                connection.SessionId = response.getHeaders().SessionId;
            } catch (err) {
                console.error("An error occurred while parsing the type 2 NTLMSSP Response:", err);
            }
        }
    })
};

const session_setup_step2 = (connection: IConnection, params: any) => {
    return new SMBMessage({
        headers:{
            'Command':'SESSION_SETUP'
            , 'SessionId':connection.SessionId
            , 'ProcessId':connection.ProcessId
        }
        , request:{
            'Buffer': createType3Message(
                connection.Type2Message
                , connection.username
                , connection.password
                , connection.workstation
                , connection.domain
            )
        }
    })
};

// used in set_info section
const fileInfoClasses = {
    'FileAllocationInformation': 19
  , 'FileBasicInformation': 4
  , 'FileDispositionInformation': 13
  , 'FileEndOfFileInformation': 20
  , 'FileFullEaInformation': 15
  , 'FileLinkInformation': 11
  , 'FileModeInformation': 16
  , 'FilePipeInformation': 23
  , 'FilePositionInformation': 14
  , 'FileRenameInformation': 10
  , 'FileShortNameInformation': 40
  , 'FileValidDataLengthInformation': 39
};

const set_info = (connection: IConnection, params: any) => {
    return new SMBMessage({
        headers: {
            'Command':'SET_INFO'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request: {
            'FileInfoClass': fileInfoClasses[params.FileInfoClass as keyof typeof fileInfoClasses]
            , 'FileId':params.FileId
            , 'Buffer':params.Buffer
        }
    })     
};

const tree_connect = (connection: IConnection, params: any) => {
    return new SMBMessage({
        headers: {
            'Command':'TREE_CONNECT'
            , 'SessionId':connection.SessionId
            , 'ProcessId':connection.ProcessId
        }
        , request: {
            'Buffer': Buffer.from(connection.fullPath, 'ucs2')
        }
        , onSuccess(connection: IConnection, response: any) {
            const header = response.getHeaders();
            connection.TreeId = header.TreeId;
        }
    })     
};

const write = (connection: IConnection, params: any) =>{
    return new SMBMessage({
        headers: {
            'Command':'WRITE'
            , 'SessionId':connection.SessionId
            , 'TreeId':connection.TreeId
            , 'ProcessId':connection.ProcessId
        }
        , request: {
            'FileId':params.FileId
            , 'Offset':params.Offset
            , 'Buffer':params.Buffer
        }
        , parseResponse(response: any) { return response.getResponse().Buffer; }
    });
};

export { 
    close, 
    create_folder, 
    create, 
    negotiate, 
    open_folder, 
    open, 
    query_directory, 
    read, 
    session_setup_step1, 
    session_setup_step2, 
    set_info, 
    tree_connect, 
    write
}