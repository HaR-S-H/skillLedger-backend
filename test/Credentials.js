import { expect } from "chai";
import hardhat from "hardhat";
const { ethers }= hardhat; // For constants


describe("Credentials Contract", function () {
    let credentials;
    let owner;
    let organization1;
    let organization2;
    let student1;
    let student2;
    let unauthorized;

    beforeEach(async function () {
        // Get signers
        [owner, organization1, organization2, student1, student2, unauthorized] = await ethers.getSigners();

        // Deploy contract
        const Credentials = await ethers.getContractFactory("Credentials");
        credentials = await Credentials.deploy();
        await credentials.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await credentials.name()).to.equal("Credentials");
            expect(await credentials.symbol()).to.equal("CRD");
        });

        it("Should set the deployer as owner", async function () {
            expect(await credentials.owner()).to.equal(owner.address);
        });

        it("Should start with token counter at 0", async function () {
            expect(await credentials.getCurrentTokenId()).to.equal(0);
        });
    });

    describe("Organization Management", function () {
        it("Should allow owner to approve organizations", async function () {
            await expect(credentials.approveOrganization(organization1.address))
                .to.emit(credentials, "OrganizationApproved")
                .withArgs(organization1.address);

            expect(await credentials.isOrganizationApproved(organization1.address)).to.be.true;
        });

        it("Should not allow non-owner to approve organizations", async function () {
            await expect(
                credentials.connect(unauthorized).approveOrganization(organization1.address)
            ).to.be.revertedWithCustomError(credentials, "OwnableUnauthorizedAccount");
        });

        it("Should return false for non-approved organizations", async function () {
            expect(await credentials.isOrganizationApproved(organization1.address)).to.be.false;
        });

        it("Should allow multiple organizations to be approved", async function () {
            await credentials.approveOrganization(organization1.address);
            await credentials.approveOrganization(organization2.address);

            expect(await credentials.isOrganizationApproved(organization1.address)).to.be.true;
            expect(await credentials.isOrganizationApproved(organization2.address)).to.be.true;
        });
    });

    describe("Certificate Minting", function () {
        beforeEach(async function () {
            // Approve organization1 for testing
            await credentials.approveOrganization(organization1.address);
        });

        it("Should allow approved organization to mint certificates", async function () {
            const tokenURI = "https://example.com/certificate/1";

            await expect(
                credentials.connect(organization1).mintCertificate(
                    student1.address,
                    organization1.address,
                    tokenURI
                )
            ).to.emit(credentials, "CertificateMinted")
             .withArgs(student1.address, 0);

            // Verify token was minted
            expect(await credentials.ownerOf(0)).to.equal(student1.address);
            expect(await credentials.tokenURI(0)).to.equal(tokenURI);
            expect(await credentials.getCurrentTokenId()).to.equal(1);
        });

        it("Should not allow non-approved organization to mint certificates", async function () {
            const tokenURI = "https://example.com/certificate/1";

            await expect(
                credentials.connect(organization2).mintCertificate(
                    student1.address,
                    organization2.address,
                    tokenURI
                )
            ).to.be.revertedWith("Not an approved organization");
        });

        it("Should not allow minting to zero address", async function () {
            const tokenURI = "https://example.com/certificate/1";

            await expect(
                credentials.connect(organization1).mintCertificate(
                    ethers.ZeroAddress,
                    organization1.address,
                    tokenURI
                )
            ).to.be.revertedWith("Invalid student address");
        });

        it("Should increment token counter after each mint", async function () {
            const tokenURI1 = "https://example.com/certificate/1";
            const tokenURI2 = "https://example.com/certificate/2";

            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                tokenURI1
            );
            expect(await credentials.getCurrentTokenId()).to.equal(1);

            await credentials.connect(organization1).mintCertificate(
                student2.address,
                organization1.address,
                tokenURI2
            );
            expect(await credentials.getCurrentTokenId()).to.equal(2);
        });

        it("Should track certificates for each student", async function () {
            const tokenURI1 = "https://example.com/certificate/1";
            const tokenURI2 = "https://example.com/certificate/2";

            // Mint two certificates for student1
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                tokenURI1
            );
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                tokenURI2
            );

            const student1Certs = await credentials.getStudentCertificates(student1.address);
            expect(student1Certs.length).to.equal(2);
            expect(student1Certs[0]).to.equal(0);
            expect(student1Certs[1]).to.equal(1);
        });

        it("Should allow anyone to call mintCertificate if organization is approved", async function () {
            const tokenURI = "https://example.com/certificate/1";

            // Even unauthorized user can call mintCertificate as long as organization is approved
            await expect(
                credentials.connect(unauthorized).mintCertificate(
                    student1.address,
                    organization1.address,
                    tokenURI
                )
            ).to.emit(credentials, "CertificateMinted")
             .withArgs(student1.address, 0);
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await credentials.approveOrganization(organization1.address);
            
            // Mint some test certificates
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                "https://example.com/cert/1"
            );
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                "https://example.com/cert/2"
            );
            await credentials.connect(organization1).mintCertificate(
                student2.address,
                organization1.address,
                "https://example.com/cert/3"
            );
        });

        it("Should return correct student certificates", async function () {
            const student1Certs = await credentials.getStudentCertificates(student1.address);
            const student2Certs = await credentials.getStudentCertificates(student2.address);

            expect(student1Certs.length).to.equal(2);
            expect(student1Certs[0]).to.equal(0);
            expect(student1Certs[1]).to.equal(1);

            expect(student2Certs.length).to.equal(1);
            expect(student2Certs[0]).to.equal(2);
        });

        it("Should return empty array for student with no certificates", async function () {
            const certs = await credentials.getStudentCertificates(unauthorized.address);
            expect(certs.length).to.equal(0);
        });

        it("Should return correct certificate metadata", async function () {
            const metadata = await credentials.getCertificateMetadata(0);
            expect(metadata).to.equal("https://example.com/cert/1");
        });

        it("Should return correct certificate owner", async function () {
            const owner0 = await credentials.getCertificateOwner(0);
            const owner2 = await credentials.getCertificateOwner(2);

            expect(owner0).to.equal(student1.address);
            expect(owner2).to.equal(student2.address);
        });

        it("Should revert when getting metadata for non-existent token", async function () {
            await expect(
                credentials.getCertificateMetadata(999)
            ).to.be.revertedWithCustomError(credentials, "ERC721NonexistentToken");
        });

        it("Should revert when getting owner for non-existent token", async function () {
            await expect(
                credentials.getCertificateOwner(999)
            ).to.be.revertedWithCustomError(credentials, "ERC721NonexistentToken");
        });
    });

    describe("ERC721 Functionality", function () {
        beforeEach(async function () {
            await credentials.approveOrganization(organization1.address);
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                "https://example.com/cert/1"
            );
        });

        it("Should support token transfers", async function () {
            // Transfer from student1 to student2
            await credentials.connect(student1).transferFrom(
                student1.address,
                student2.address,
                0
            );

            expect(await credentials.ownerOf(0)).to.equal(student2.address);
        });

        it("Should support approvals", async function () {
            await credentials.connect(student1).approve(student2.address, 0);
            
            expect(await credentials.getApproved(0)).to.equal(student2.address);
            
            // student2 can now transfer the token
            await credentials.connect(student2).transferFrom(
                student1.address,
                student2.address,
                0
            );
            
            expect(await credentials.ownerOf(0)).to.equal(student2.address);
        });

        it("Should return correct balance", async function () {
            expect(await credentials.balanceOf(student1.address)).to.equal(1);
            expect(await credentials.balanceOf(student2.address)).to.equal(0);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple approvals of same organization", async function () {
            await credentials.approveOrganization(organization1.address);
            await credentials.approveOrganization(organization1.address); // Approve again
            
            expect(await credentials.isOrganizationApproved(organization1.address)).to.be.true;
        });

        it("Should handle minting certificates with empty URI", async function () {
            await credentials.approveOrganization(organization1.address);
            
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                ""
            );
            
            expect(await credentials.tokenURI(0)).to.equal("");
        });

        it("Should maintain separate certificate lists for different students", async function () {
            await credentials.approveOrganization(organization1.address);
            
            // Mint certificates for different students
            await credentials.connect(organization1).mintCertificate(
                student1.address,
                organization1.address,
                "cert1"
            );
            await credentials.connect(organization1).mintCertificate(
                student2.address,
                organization1.address,
                "cert2"
            );
            
            const student1Certs = await credentials.getStudentCertificates(student1.address);
            const student2Certs = await credentials.getStudentCertificates(student2.address);
            
            expect(student1Certs).to.deep.equal([ethers.toBigInt(0)]);
            expect(student2Certs).to.deep.equal([ethers.toBigInt(1)]);
        });
    });
});