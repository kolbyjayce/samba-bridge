const { SMB } = require("../dist");

async function main() {
  const smbOptions = {
    host: "\\\\corp.grimme.com\\\\grimme_group",
    username: "kolby.christiansen",
    password: "C16a6474W568e397?",
  };

  const smb = new SMB(smbOptions);
  await smb.connect();
  console.log("finished");

  smb.close();
}

main();
