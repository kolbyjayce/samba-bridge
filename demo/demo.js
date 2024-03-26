const { SMB } = require("../dist");

async function main() {
  const smbOptions = {
      host: "\\\\corp.grimme.com\\\\grimme_group",
      username: "kolby.christiansen",
      password: "C16a6474W568e397?",
      domain: "corp.grimme.com",
      debug: true,
  };

  const smb = new SMB(smbOptions);
  console.log("finished");
  smb.exists("temp.txt");
  smb.close();
}

main();
