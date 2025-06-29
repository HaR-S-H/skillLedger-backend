import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CredentialsModule = buildModule("CredentialsModule", (m) => {
  const credentials = m.contract("Credentials");

  return { credentials };
});

export default CredentialsModule;
