# samba-bridge

**If Node version >= 16 then it is required to enable openssl legacy options**

This is due to using md4 encryptions algorithms for ntlmssp encryption algorithms for server authentication.

Linux/Mac
`export NODE_OPTIONS=--openssl-legacy-provider`

Windows CMD
`set NODE_OPTIONS=--openssl-legacy-provider`

Windows Powershell
`$env:NODE_OPTIONS="--openssl-legacy-provider"`

***These will only set this option for the current shell for a more permanent add to shell options like below***

Using Bash
`echo 'export NODE_OPTIONS=--openssl-legacy-provider' >> ~/.bash_profile`

Using zsh (newer MacOS)
`echo 'export NODE_OPTIONS=--openssl-legacy-provider' >> ~/.zshrc`

Windows CMD (as admin)
`setx NODE_OPTIONS --openssl-legacy-provider /m`