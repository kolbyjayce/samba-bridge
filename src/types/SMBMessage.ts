export interface ICommandTranslations {
    [key: string]: number;
    NEGOTIATE: number;
    SESSION_SETUP: number;
    LOGOFF: number;
    TREE_CONNECT: number;
    TREE_DISCONNECT: number;
    CREATE: number;
    CLOSE: number;
    FLUSH: number;
    READ: number;
    WRITE: number;
    LOCK: number;
    IOCTL: number;
    CANCEL: number;
    ECHO: number;
    QUERY_DIRECTORY: number;
    CHANGE_NOTIFY: number;
    QUERY_INFO: number;
    SET_INFO: number;
    OPLOCK_BREAK: number;
}

export interface IHeaderTranslations {
    Command: ICommandTranslations
}

