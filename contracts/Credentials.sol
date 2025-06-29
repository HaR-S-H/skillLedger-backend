// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Credentials is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct Organization {
        bool approved;
    }

    mapping(address => Organization) public organizations; 
    mapping(address => uint256[]) public studentCertificates;

    event OrganizationApproved(address orgAddress);
    event CertificateMinted(address student, uint256 tokenId);

    constructor() ERC721("Credentials", "CRD") Ownable(msg.sender) {}

    function approveOrganization(address orgAddress) external onlyOwner {
        organizations[orgAddress].approved = true;
        emit OrganizationApproved(orgAddress);
    }

    function mintCertificate(address student, address organization, string calldata tokenURI) external {
        require(organizations[organization].approved, "Not an approved organization");
        require(student != address(0), "Invalid student address");

        uint256 tokenId = _tokenIdCounter;
        _safeMint(student, tokenId);
        _setTokenURI(tokenId, tokenURI);
        studentCertificates[student].push(tokenId);
        _tokenIdCounter++;

        emit CertificateMinted(student, tokenId);
    }

    // ✅ Returns the token IDs owned by a student
    function getStudentCertificates(address student) external view returns (uint256[] memory) {
        return studentCertificates[student];
    }

    // ✅ Check if an organization is approved
    function isOrganizationApproved(address orgAddress) external view returns (bool) {
        return organizations[orgAddress].approved;
    }

    // ✅ Get current token counter (helpful for frontend/admin)
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ✅ Get token URI directly by tokenId (already available via ERC721URIStorage, but added for clarity)
    function getCertificateMetadata(uint256 tokenId) external view returns (string memory) {
        return tokenURI(tokenId);
    }

    // ✅ Get the owner of a specific tokenId
    function getCertificateOwner(uint256 tokenId) external view returns (address) {
        return ownerOf(tokenId);
    }
}
