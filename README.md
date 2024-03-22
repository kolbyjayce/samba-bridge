# samba-bridge
SMB connections that allows file system operations cross platform in NodeJS

### Use

Initialize a new connection 

`const smb = new SMBClient(SMBOptions)`

SMB Options have 3 required fields
```
host: string,
username: string,
password: string
```

After initialized, a you must create a connection. This connection will return a promise that must resolve before any file operations can occur
`await smb.connect()`