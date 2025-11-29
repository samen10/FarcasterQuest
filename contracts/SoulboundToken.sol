// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SoulboundToken
 * @dev Non-transferable ERC721 token for lottery participation
 * Each wallet can only mint once after completing social tasks
 */
contract SoulboundToken is ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 private _tokenIdCounter;
    address public lotteryContract;
    address public backendSigner;
    
    // Mapping to track if an address has minted
    mapping(address => bool) public hasMinted;
    
    // Mapping to store Farcaster FID for each token
    mapping(uint256 => uint256) public tokenFarcasterFid;
    
    // Events
    event TokenMinted(address indexed to, uint256 tokenId, uint256 farcasterFid);
    event LotteryContractUpdated(address indexed newLotteryContract);
    event BackendSignerUpdated(address indexed newSigner);

    constructor(
        address _backendSigner
    ) ERC721("Base SBT Lottery", "BSBT") Ownable(msg.sender) {
        backendSigner = _backendSigner;
    }

    /**
     * @dev Mint a new SBT to the caller
     * @param farcasterFid The Farcaster FID of the user
     * @param signature Backend signature proving task completion
     */
    function mint(uint256 farcasterFid, bytes memory signature) external {
        require(!hasMinted[msg.sender], "Already minted");
        
        // Verify the signature from backend
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, farcasterFid));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(signer == backendSigner, "Invalid signature");
        
        // Mint the token
        uint256 tokenId = _tokenIdCounter++;
        hasMinted[msg.sender] = true;
        tokenFarcasterFid[tokenId] = farcasterFid;
        
        _safeMint(msg.sender, tokenId);
        
        // Notify lottery contract if set
        if (lotteryContract != address(0)) {
            ILottery(lotteryContract).registerParticipant(msg.sender);
        }
        
        emit TokenMinted(msg.sender, tokenId, farcasterFid);
    }

    /**
     * @dev Get total number of tokens minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Set the lottery contract address
     */
    function setLotteryContract(address _lotteryContract) external onlyOwner {
        lotteryContract = _lotteryContract;
        emit LotteryContractUpdated(_lotteryContract);
    }

    /**
     * @dev Update the backend signer address
     */
    function setBackendSigner(address _backendSigner) external onlyOwner {
        backendSigner = _backendSigner;
        emit BackendSignerUpdated(_backendSigner);
    }

    /**
     * @dev Override transfer functions to make token soulbound (non-transferable)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from = address(0)) but not transfers
        if (from != address(0)) {
            revert("Soulbound: Transfer not allowed");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override approval functions to prevent approvals
     */
    function approve(address, uint256) public pure override {
        revert("Soulbound: Approval not allowed");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: Approval not allowed");
    }
}

interface ILottery {
    function registerParticipant(address participant) external;
}
