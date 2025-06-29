import { ethers } from "ethers";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the JSON file synchronously
const credentialsArtifact = JSON.parse(
  readFileSync(join(__dirname, '../artifacts/contracts/Credentials.sol/Credentials.json'), 'utf8')
);

const abi = credentialsArtifact.abi;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const credentialsContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  abi,
  signer
);

export default credentialsContract;