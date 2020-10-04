/**
 * @title WOMTokenLocker
 * @author WOM Protocol <info@womprotocol.io>
 * @dev Locks WOM specific ERC20 tokens for a particular duration of time.
*/

pragma solidity >=0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract WOMTokenLocker is Ownable {

    IERC20 public WOM_TOKEN;
    mapping (address => Allocation) public allocation;

    struct Allocation {
        uint256 release; // Time in epoch to release funds
        uint256 amount;  // Amount to release
    }

    event AllocationAdded(address indexed recipient, uint256 release, uint256 amount);
    event AllocationRemoved(address indexed recipient);
    event AllocationClaimed(address indexed recipient, uint256 release, uint256 amount);

    constructor(address _womToken) public {
        WOM_TOKEN = IERC20(_womToken);
    }

    /**
    * @dev Create allocation for particular recipient.
    * @param recipient Receiving address of the funds.
    * @param release Time in epoch to release funds.
    * @param amount Amount of funds to allocate.
    */
    function addAllocation(address recipient, uint256 release, uint256 amount) 
        public
        onlyOwner
    {
        require(WOM_TOKEN.allowance(owner(), address(this)) >= amount, 'WOMTokenLocker: allowance is less than amount');
        
        WOM_TOKEN.transferFrom(owner(), address(this), amount);
        allocation[recipient] = Allocation({
            release: release,
            amount: amount
        });

        emit AllocationAdded(msg.sender, release, amount);
    }

    /**
    * @dev Remove allocation for particular recipient.
    * @param recipient Address to remove allocation.
    */
    function removeAllocation(address recipient) 
        public
        onlyOwner
    {
        Allocation memory alloc = allocation[recipient];

        require(alloc.amount != 0, 'WOMTokenLocker: client does not exist');

        delete allocation[msg.sender];
        WOM_TOKEN.transfer(owner(), alloc.amount);

        emit AllocationRemoved(msg.sender);
    }

    /**
    * @dev Claim allocation from recipient.
    */
    function claimAllocation() 
        public
    {
        Allocation memory alloc = allocation[msg.sender];

        require(alloc.amount != 0, 'WOMTokenLocker: client does not have allocation');
        require(now >= alloc.release, 'WOMTokenLocker: client cannot claim with time lock');

        require(WOM_TOKEN.balanceOf(address(this)) >= alloc.amount, 'WOMTokenLocker: contract does not have sufficient funds');

        delete allocation[msg.sender];
        WOM_TOKEN.transfer(msg.sender, alloc.amount);
        
        emit AllocationClaimed(msg.sender, alloc.release, alloc.amount);
    }
}