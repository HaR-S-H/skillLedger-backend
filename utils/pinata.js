import axios from "axios";
import FormData from "form-data";
import mime from "mime-types";

const pinFileToIPFS = async (buffer, fileName) => {
  try {
    const formData = new FormData();
  const contentType = mime.lookup(fileName) || "application/octet-stream";

  formData.append("file", buffer, {
    filename: fileName,
    contentType,
  });

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    maxBodyLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
  });

  return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
  } catch (error) {
    console.log(error);
    
  }
};

export default pinFileToIPFS;
