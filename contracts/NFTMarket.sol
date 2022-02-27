// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMarket is ReentrancyGuard
{
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemSold;

    address payable owner;
    uint256 listingPrice = 0.025 ether;

    constructor()
    {
        owner = payable(msg.sender);
    }

    struct MarketItem
    {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    event MarketItemCreated 
    (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    mapping(uint256 => MarketItem) private idToMarketItem;

    function getSender() public view returns (address)
    {
        return msg.sender;
    }

    function getListingPrice() public view returns (uint256)
    {
        return listingPrice;
    }

    function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public payable nonReentrant
    {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "You have to pay the listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    function createMarketSale(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant
    {
        uint price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        require(msg.value == price, "Please submit the asking price!");

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemSold.increment();
        payable(owner).transfer(listingPrice);   
    }

    function fetchMarketItems() public view returns (MarketItem[] memory)
    {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = itemCount -  _itemSold.current();
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        uint currentIdx = 0;
        for(uint i=1; i<=itemCount; i++)
        {
            if(idToMarketItem[i].owner == address(0))
            {
                uint currentItemId = idToMarketItem[i].itemId;
                MarketItem storage currentItem = idToMarketItem[currentItemId];
                items[currentIdx] = currentItem;
                currentIdx+=1;
            }
        }
        return items;    
    } 

    function fetchMyNFTs() public view returns (MarketItem[] memory)
    {
        uint itemCount = _itemIds.current();
        uint myItemCount = 0;

        for(uint i=1;i<=itemCount;i++)
        {
            if(idToMarketItem[i].owner == msg.sender)
            {
                myItemCount+1;
            }   
        }

        MarketItem[] memory myItems = new MarketItem[](myItemCount);
        uint currentIdx = 0;
        
        for(uint i=1;i<=myItemCount;i++)
        {
            if(idToMarketItem[i].owner == msg.sender)
            {
                uint currentItemId = idToMarketItem[i].itemId;
                MarketItem storage currentItem = idToMarketItem[currentItemId]; 
                myItems[currentIdx] = currentItem;
                currentIdx+=1;
            }
        }

        return myItems;
    }

    function fetchMyCreatedItems() public view returns (MarketItem[] memory)
    {
        uint itemCount = _itemIds.current();
        uint myItemCount = 0;

        for(uint i=1;i<=itemCount;i++)
        {
            if(idToMarketItem[i].seller == msg.sender)
            {
                myItemCount+1;
            }   
        }

        MarketItem[] memory myItems = new MarketItem[](myItemCount);
        uint currentIdx = 0;
        
        for(uint i=1;i<=myItemCount;i++)
        {
            if(idToMarketItem[i].seller == msg.sender)
            {
                uint currentItemId = idToMarketItem[i].itemId;
                MarketItem storage currentItem = idToMarketItem[currentItemId]; 
                myItems[currentIdx] = currentItem;
                currentIdx+=1;
            }
        }

        return myItems;        
    }

}