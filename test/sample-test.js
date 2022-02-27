const { expect } = require("chai");
const { ethers } = require("hardhat");
const { list } = require("postcss");

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function (){
    // Market Contract
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    // NFT Contract
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress =  nft.address;

    let listingPrice = market.getListingPrice();
    // listingPrice = listingPrice.toString();
    
    const auctionPrice = ethers.utils.parseUnits('1','ether');

    // Minting some NFTs
    await nft.createToken("https://www.mytokenlocation.com");
    await nft.createToken("https://www.mytokenlocation2.com");

    // Cretaing a Market Item
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice});
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice});

    // Accounts
    const [_,buyerAddress1, buyerAddress2, buyerAddress3] = await ethers.getSigners();
  
    // Creating a Market Sale
    await market.connect(buyerAddress1).createMarketSale(nftContractAddress, 1, {value: auctionPrice});
    
    // Items in market
    items = await market.fetchMarketItems();
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item;
    }))
    console.log("Items in Market: ", items);
  });
});
