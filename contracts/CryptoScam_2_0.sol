// SPDX-License-Identifier: UNLICENSED 

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CryptoScam_2_0 is ERC20 {
    address private _owner;
    constructor(string memory name, string memory symbol) 
        ERC20(name,symbol) 
    {
        _owner = msg.sender;
        _mint(msg.sender, 1000);
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == _owner, "You're not the owner, walk away");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}