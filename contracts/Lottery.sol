// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Lottery
 * @dev Lottery contract for SBT holders with dynamic winner count based on participants
 * 
 * Winner count based on participants:
 * - 100-499 participants: 1 winner
 * - 500-999 participants: 2 winners
 * - 1000-1999 participants: 3 winners
 * - 2000+ participants: 4 winners
 * 
 * Each winner receives approximately $5 worth of ETH
 */
contract Lottery is Ownable, ReentrancyGuard {
    // Prize per winner (approximately $5 in ETH)
    uint256 public constant PRIZE_PER_WINNER = 0.002 ether;
    
    // Lottery state
    address public sbtContract;
    uint256 public endTime;
    bool public winnersDrawn;
    bool public isActive;
    
    // Participants
    address[] public participants;
    mapping(address => bool) public isParticipant;
    mapping(address => uint256) public participantIndex;
    
    // Winners
    address[] public winners;
    mapping(address => uint256) public winnerPrize;
    mapping(address => bool) public hasClaimed;
    
    // Random seed for winner selection
    uint256 private randomSeed;
    
    // Events
    event ParticipantRegistered(address indexed participant);
    event WinnersDrawn(address[] winners);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event PrizeDeposited(address indexed depositor, uint256 amount);
    event LotteryEnded();
    event LotteryReset();

    constructor(
        address _sbtContract,
        uint256 _durationDays
    ) Ownable(msg.sender) {
        sbtContract = _sbtContract;
        endTime = block.timestamp + (_durationDays * 1 days);
        isActive = true;
    }

    /**
     * @dev Receive ETH for prize pool
     */
    receive() external payable {
        emit PrizeDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Register a participant (called by SBT contract)
     */
    function registerParticipant(address participant) external {
        require(msg.sender == sbtContract, "Only SBT contract");
        require(isActive, "Lottery not active");
        require(block.timestamp < endTime, "Lottery ended");
        require(!isParticipant[participant], "Already registered");
        
        participantIndex[participant] = participants.length;
        participants.push(participant);
        isParticipant[participant] = true;
        
        emit ParticipantRegistered(participant);
    }

    /**
     * @dev Get the number of winners based on participant count
     */
    function getWinnersCount() public view returns (uint256) {
        uint256 count = participants.length;
        if (count >= 2000) return 4;
        if (count >= 1000) return 3;
        if (count >= 500) return 2;
        if (count >= 100) return 1;
        return 0;
    }

    /**
     * @dev Draw winners using pseudo-random selection
     * Note: For production, consider using Chainlink VRF for true randomness
     */
    function drawWinners() external onlyOwner {
        require(isActive, "Lottery not active");
        require(block.timestamp >= endTime || participants.length >= 2000, "Lottery not ended");
        require(!winnersDrawn, "Winners already drawn");
        require(participants.length >= 100, "Not enough participants");
        
        uint256 winnerCount = getWinnersCount();
        require(address(this).balance >= winnerCount * PRIZE_PER_WINNER, "Insufficient prize pool");
        
        // Generate initial random seed
        randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            participants.length,
            msg.sender
        )));
        
        // Select winners
        address[] memory selectedWinners = new address[](winnerCount);
        bool[] memory selected = new bool[](participants.length);
        
        for (uint256 i = 0; i < winnerCount; i++) {
            uint256 randomIndex;
            uint256 attempts = 0;
            
            do {
                randomSeed = uint256(keccak256(abi.encodePacked(randomSeed, i, attempts)));
                randomIndex = randomSeed % participants.length;
                attempts++;
            } while (selected[randomIndex] && attempts < 100);
            
            selected[randomIndex] = true;
            selectedWinners[i] = participants[randomIndex];
            winners.push(participants[randomIndex]);
            winnerPrize[participants[randomIndex]] = PRIZE_PER_WINNER;
        }
        
        winnersDrawn = true;
        isActive = false;
        
        emit WinnersDrawn(selectedWinners);
        emit LotteryEnded();
    }

    /**
     * @dev Claim prize (for winners)
     */
    function claimPrize() external nonReentrant {
        require(winnersDrawn, "Winners not drawn");
        require(winnerPrize[msg.sender] > 0, "Not a winner");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        uint256 prize = winnerPrize[msg.sender];
        hasClaimed[msg.sender] = true;
        
        (bool success, ) = msg.sender.call{value: prize}("");
        require(success, "Transfer failed");
        
        emit PrizeClaimed(msg.sender, prize);
    }

    /**
     * @dev Get participant count
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    /**
     * @dev Get prize pool
     */
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get end time
     */
    function getEndTime() external view returns (uint256) {
        return endTime;
    }

    /**
     * @dev Get all winners
     */
    function getWinners() external view returns (address[] memory) {
        return winners;
    }

    /**
     * @dev Check if an address is a winner
     */
    function isWinner(address account) external view returns (bool) {
        return winnerPrize[account] > 0;
    }

    /**
     * @dev Update SBT contract address
     */
    function setSbtContract(address _sbtContract) external onlyOwner {
        sbtContract = _sbtContract;
    }

    /**
     * @dev Extend end time
     */
    function extendEndTime(uint256 additionalDays) external onlyOwner {
        require(isActive, "Lottery not active");
        endTime += additionalDays * 1 days;
    }

    /**
     * @dev Withdraw remaining funds (after lottery ends and all claims)
     */
    function withdrawRemaining() external onlyOwner {
        require(!isActive, "Lottery still active");
        require(winnersDrawn, "Winners not drawn");
        
        uint256 remaining = address(this).balance;
        require(remaining > 0, "No funds");
        
        (bool success, ) = owner().call{value: remaining}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Emergency stop
     */
    function emergencyStop() external onlyOwner {
        isActive = false;
        emit LotteryEnded();
    }
}
