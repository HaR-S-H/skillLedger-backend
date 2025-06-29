  import axios from "axios";

  const pinJSONToIPFS = async (jsonData) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    const body = {
      pinataMetadata: {
        name: "skillData"
      },
      pinataContent: jsonData
    };

    const res = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
      }
    });

    const hash = res.data.IpfsHash;
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  };

  export default pinJSONToIPFS;