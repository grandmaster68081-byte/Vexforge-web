// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VexforgeCards (VFC)
 * @dev ERC-721 NFT para cartas VEXFORGE — Polygon Mainnet (chain 137)
 * @notice Mintable rarities: Rare, Epic, Legendary, Mythic. Max supply: 999,999.
 */
contract VexforgeCards is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    uint256 public constant MAX_SUPPLY = 999999;

    event CardMinted(address indexed to, uint256 indexed tokenId, string cardCode, string rarity);

    constructor() ERC721("VexforgeCards", "VFC") Ownable(msg.sender) {}

    /// @dev Owner mints a card NFT to a player wallet.
    function mintCard(
        address to,
        string memory tokenURI,
        string memory cardCode,
        string memory rarity
    ) external onlyOwner returns (uint256) {
        require(_tokenIds.current() < MAX_SUPPLY, "VexforgeCards: max supply reached");
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        emit CardMinted(to, newTokenId, cardCode, rarity);
        return newTokenId;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIds.current();
    }
}
