export interface IStructureOptions {
    "close": IStructure;
    "create": IStructure;
    "negotiate": IStructure;
    "query_directory": IStructure;
    "read": IStructure;
    "session_setup": IStructure;
    "set_info": IStructure;
    "tree_connect": IStructure;
    "write": IStructure;
}

export interface IStructure {
    "request": Array<Array<any>>;
    "response": Array<Array<any>>;
}