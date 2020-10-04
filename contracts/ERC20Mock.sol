/**
 * @title ERC20Mock
 * @author WOM Protocol <info@womprotocol.io>
 * @dev Basic ERC20 token.
*/

pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ERC20Mock is ERC20 {

    constructor(string memory _name, string memory _symbol, uint256 _value) 
        public 
        ERC20(_name, _symbol) 
    {
        _mint(msg.sender, _value);
    }

    function burn(address user, uint256 value) 
        public
    {
        _burn(user, value);
    }
}
