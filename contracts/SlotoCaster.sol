// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SlotoCaster {
    
    // Constants
    uint256 public constant REWARD_AMOUNT = 0.0003 ether; // ~$1
    uint256 public constant SPIN_PACK_COST = 0.00003 ether; // ~$0.10
    uint256 public constant SPINS_PER_PACK = 10;
    uint256 public constant MAX_DAILY_WINNERS = 5;
    uint256 public constant SECONDS_PER_DAY = 86400;

    // State variables
    address public owner;
    uint256 public currentDay;
    uint256 public dailyWinnerCount;
    bool public paused;
    
    // Corrected nonReentrant state
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    // Mappings
    mapping(uint256 => uint256) public fidWonOnDay;
    mapping(uint256 => address) public fidToAddress;
    mapping(uint256 => uint256) public fidRemainingSpins;
    
    // Structs
    struct Winner {
        uint256 fid;
        address wallet;
        uint256 timestamp;
        uint256 day;
    }
    
    struct PlayerStats {
        uint256 totalSpinsPurchased;
        uint256 totalSpinsUsed;
        uint256 totalWins;
    }
    
    // Storage
    Winner[] public winners;
    mapping(uint256 => PlayerStats) public playerStats;
    
    // Events
    event SpinPackPurchased(uint256 indexed fid, address indexed wallet, uint256 spinsAdded);
    event GamePlayed(uint256 indexed fid, address indexed wallet, bool won, uint256 spinsRemaining);
    event RewardClaimed(uint256 indexed fid, address indexed wallet, uint256 amount);
    event ContractFunded(uint256 amount);
    event DayReset(uint256 newDay);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        currentDay = getCurrentDay();
        paused = false;
        _status = _NOT_ENTERED;
    }
    
    // Main Functions
    function purchaseSpins(uint256 fid) external payable whenNotPaused {
        require(fid > 0, "Invalid FID");
        require(msg.value >= SPIN_PACK_COST, "Insufficient payment");
        
        _checkAndResetDay();
        
        fidToAddress[fid] = msg.sender;
        fidRemainingSpins[fid] += SPINS_PER_PACK;
        playerStats[fid].totalSpinsPurchased += SPINS_PER_PACK;
        
        if (msg.value > SPIN_PACK_COST) {
            payable(msg.sender).transfer(msg.value - SPIN_PACK_COST);
        }
        
        emit SpinPackPurchased(fid, msg.sender, SPINS_PER_PACK);
    }
    
    function playSlotMachine(uint256 fid) external whenNotPaused nonReentrant {
        require(fidRemainingSpins[fid] > 0, "No spins remaining");
        require(fidToAddress[fid] == msg.sender, "FID not associated");
        
        _checkAndResetDay();
        
        require(fidWonOnDay[fid] != currentDay, "Already won today");
        require(dailyWinnerCount < MAX_DAILY_WINNERS, "Daily limit reached");
        
        fidRemainingSpins[fid]--;
        playerStats[fid].totalSpinsUsed++;
        
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            fid,
            block.number
        )));
        
        bool hasWon = (randomSeed % 100) < 5;
        
        emit GamePlayed(fid, msg.sender, hasWon, fidRemainingSpins[fid]);
        
        if (hasWon) {
            require(address(this).balance >= REWARD_AMOUNT, "Insufficient contract balance");
            
            fidWonOnDay[fid] = currentDay;
            dailyWinnerCount++;
            playerStats[fid].totalWins++;
            
            winners.push(Winner({
                fid: fid,
                wallet: msg.sender,
                timestamp: block.timestamp,
                day: currentDay
            }));
            
            payable(msg.sender).transfer(REWARD_AMOUNT);
            emit RewardClaimed(fid, msg.sender, REWARD_AMOUNT);
        }
    }
    
    // View Functions
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / SECONDS_PER_DAY;
    }
    
    function getRemainingSpins(uint256 fid) external view returns (uint256) {
        return fidRemainingSpins[fid];
    }
    
    function getDailyWinnersCount() external view returns (uint256) {
        if (getCurrentDay() > currentDay) {
            return 0;
        }
        return dailyWinnerCount;
    }
    
    function hasFidWonToday(uint256 fid) external view returns (bool) {
        return fidWonOnDay[fid] == getCurrentDay();
    }
    
    function getTotalWinners() external view returns (uint256) {
        return winners.length;
    }
    
    function getLatestWinners(uint256 count) external view returns (Winner[] memory) {
        uint256 totalWinners = winners.length;
        if (totalWinners == 0) {
            return new Winner[](0);
        }
        
        uint256 returnCount = count > totalWinners ? totalWinners : count;
        Winner[] memory latestWinners = new Winner[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            latestWinners[i] = winners[totalWinners - 1 - i];
        }
        
        return latestWinners;
    }
    
    function getPlayerStats(uint256 fid) external view returns (PlayerStats memory) {
        return playerStats[fid];
    }
    
    function canFidPlay(uint256 fid) external view returns (bool canPlay, string memory reason) {
        if (paused) {
            return (false, "Contract paused");
        }
        
        if (fidRemainingSpins[fid] == 0) {
            return (false, "No spins remaining");
        }
        
        uint256 today = getCurrentDay();
        if (fidWonOnDay[fid] == today) {
            return (false, "Already won today");
        }
        
        uint256 currentWinners = today > currentDay ? 0 : dailyWinnerCount;
        if (currentWinners >= MAX_DAILY_WINNERS) {
            return (false, "Daily winner limit reached");
        }
        
        return (true, "Can play");
    }
    
    // Internal Functions
    function _checkAndResetDay() internal {
        uint256 newDay = getCurrentDay();
        if (newDay > currentDay) {
            currentDay = newDay;
            dailyWinnerCount = 0;
            emit DayReset(newDay);
        }
    }
    
    // Owner Functions
    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        emit ContractFunded(msg.value);
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner).transfer(balance);
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Receive ETH
    receive() external payable {
        emit ContractFunded(msg.value);
    }
}
