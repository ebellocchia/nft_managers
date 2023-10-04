import { BigNumber, Contract, ContractFactory } from "ethers";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// Project
import * as constants from "../common/Constants";
import {
  Accounts, TestContext, 
  initTestContext, initTokens, deployProxyContract
} from "../common/UtilsCommon";


//
// Custom types
//

type AuctionStatesType = {
  [key: string]: number;
};

//
// Constants
//

export const AuctionStates: AuctionStatesType = {
  INACTIVE: 0,
  ACTIVE: 1,
  COMPLETED: 2
};

//
// Interfaces
//

export interface Auction {
  nftAmount: BigNumber;
  highestBidder: string;
  erc20Contract: string;
  erc20StartPrice: BigNumber;
  erc20MinimumBidIncrement: BigNumber;
  erc20HighestBid: BigNumber;
  startTime: BigNumber;
  endTime: BigNumber;
  extendTimeSec: BigNumber;
  state: AuctionStatesType;
}

export interface AuctionTestContext extends TestContext {
  auction: Contract;
}

//
// Exported functions
//

export async function initAuctionTestContext() : Promise<AuctionTestContext> {
  const test_ctx: TestContext = await initTestContext();
  const auction: Contract = await deployAuctionProxyContract(test_ctx.payment_erc20_address);

  return {
    accounts: test_ctx.accounts,
    mock_erc20: test_ctx.mock_erc20,
    mock_erc721: test_ctx.mock_erc721,
    mock_erc1155: test_ctx.mock_erc1155,
    payment_erc20_address: test_ctx.payment_erc20_address,
    auction: auction,
    user_1_account: test_ctx.user_1_account,
    user_1_address: test_ctx.user_1_address,
    user_2_account: test_ctx.user_2_account,
    user_2_address: test_ctx.user_2_address,
    user_3_account: test_ctx.user_3_account,
    user_3_address: test_ctx.user_3_address
  };
}

export async function initAuctionTestContextAndToken() : Promise<AuctionTestContext> {
  const test_ctx: AuctionTestContext = await initAuctionTestContext();
  await initTokens(
    test_ctx.accounts,
    test_ctx.auction.address,
    test_ctx.mock_erc20,
    test_ctx.mock_erc721,
    test_ctx.mock_erc1155,
    test_ctx.user_1_account,
    test_ctx.user_2_account,
    test_ctx.user_3_account
  );

  return test_ctx;
}

export async function initAuctionTestContextAndCreate() : Promise<AuctionTestContext> {
  const test_ctx: AuctionTestContext = await initAuctionTestContextAndToken();
  const duration_sec: number = 24 * 60 * 60;
  const extend_time_sec: number = 2 * 60;
  const erc20_start_price: number = constants.ERC20_TOKEN_SUPPLY / 20;
  const erc20_min_bid_increment: number = erc20_start_price / 10;
  const nft_id: number = 0;

  await test_ctx.auction.createERC721Auction(
    test_ctx.mock_erc721.address,
    nft_id,
    test_ctx.mock_erc20.address,
    erc20_start_price,
    erc20_min_bid_increment,
    duration_sec,
    extend_time_sec
  );
  await test_ctx.auction.createERC1155Auction(
    test_ctx.mock_erc1155.address,
    nft_id,
    constants.ERC1155_TOKEN_AMOUNT,
    test_ctx.mock_erc20.address,
    erc20_start_price,
    erc20_min_bid_increment,
    duration_sec,
    extend_time_sec
  );

  return test_ctx;
}

export async function initAuctionTestContextAndBid() : Promise<AuctionTestContext> {
  const test_ctx: AuctionTestContext = await initAuctionTestContextAndCreate();
  const nft_id: number = 0;
  const auction_data_erc721: Auction = await test_ctx.auction.Auctions(test_ctx.mock_erc721.address, nft_id);
  const auction_data_erc1155: Auction = await test_ctx.auction.Auctions(test_ctx.mock_erc1155.address, nft_id);

  await test_ctx.auction.connect(test_ctx.user_1_account).bidAtAuction(
    test_ctx.mock_erc721.address,
    nft_id,
    auction_data_erc721.erc20StartPrice.add(auction_data_erc721.erc20MinimumBidIncrement)
  );
  await test_ctx.auction.connect(test_ctx.user_2_account).bidAtAuction(
    test_ctx.mock_erc1155.address,
    nft_id,
    auction_data_erc1155.erc20StartPrice.add(auction_data_erc1155.erc20MinimumBidIncrement)
  );

  // Make sure the auctions are expired
  await time.increase(auction_data_erc721.endTime.sub(auction_data_erc721.startTime).add(1));

  return test_ctx;
}

export async function deployAuctionContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsAuction");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function deployAuctionUpgradedContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsAuctionUpgraded");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function getAuctionUpgradedContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsAuctionUpgraded");
  return contract_factory.attach(address);
}

//
// Not exported functions
//

async function getAuctionContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsAuction");
  return contract_factory.attach(address);
}

async function deployAuctionProxyContract(
  paymentERC20Address: string
) : Promise<Contract> {
  const auction_logic_instance: Contract = await deployAuctionContract();
  const proxy_instance: Contract = await deployProxyContract(auction_logic_instance, paymentERC20Address);

  return getAuctionContractAt(proxy_instance.address);
}
