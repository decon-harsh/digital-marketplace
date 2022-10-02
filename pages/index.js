import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import { nftAddress, nftMarketAddress } from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function Home() {

  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    const nftContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider);
    const data = await marketContract.fetchMarketItems();

    console.log(data);
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await nftContract.tokenURI(i.tokenId);
      console.log(tokenUri);
      const meta = await axios.get(tokenUri);
      // const meta = await axios.get(tokenUri,
      //   {
      //     withCredentials : false,
      //     headers: {
      //       'Access-Control-Allow-Origin' : '*',
      //       'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS',   
      //     }
      //   }
      // );

      console.log(meta.data.properties.image.description);

      let price = ethers.utils.formatUnits(i.price.toString(), "ether");
      let item = {
        price: price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
      }
      // image: meta.data.image,
      // name: meta.data.name,
      // description: meta.data.description,
      return item;
    }));
    setNfts(items);
    setLoadingState('loaded');
  }


  async function buyNft(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await marketContract.createMarketSale(nftAddress, nft.tokenId, { value: price });
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState == "loaded" && !nfts.length) return (
    <h1 className="text-center px-20 py-10 text-4xl"> No items in MarketPlace</h1>
  );

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} Matic</p>
                  <button className="w-full bg-yellow-400 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
