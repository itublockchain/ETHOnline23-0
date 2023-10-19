// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockBAYC is ERC721 {
    constructor() ERC721("Bored Ape Yacht Club", "BAYC") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}