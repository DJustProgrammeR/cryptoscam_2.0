// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract Cryptoscam_2_1 is ERC20, ERC20Permit, ERC20Votes {
    constructor(string memory name, string memory symbol)  ERC20(name, symbol) ERC20Permit(name) {
        _owner = msg.sender;
        _mint(msg.sender, 1_000);
    }

    address private _owner;
    
    // Overrides IERC6372 functions to make the token & governor timestamp-based
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == _owner, "You're not the owner, walk away");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function transferOwnership(address newOwner) public {
        require(msg.sender == _owner, "Not owner");
        require(newOwner != address(0), "Invalid address");
        _owner = newOwner;
    }
}