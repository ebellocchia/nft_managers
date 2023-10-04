import { BigNumber, Contract, ContractFactory } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "../common/Constants";
import {
  Accounts, TestContext, 
  initTestContext, initTokens, deployProxyContract
} from "../common/UtilsCommon";


//
// Interfaces
//

export interface Sale {
  nftAmount: BigNumber;
  erc20Contract: string;
  erc20Amount: BigNumber;
  isActive: boolean;  
}

export interface SellerTestContext extends TestContext {
  seller: Contract;
}

//
// Exported functions
//

export async function initSellerTestContext() : Promise<SellerTestContext> {
  const test_ctx: TestContext = await initTestContext();
  const seller: Contract = await deploySellerProxyContract(test_ctx.payment_erc20_address);

  return {
    accounts: test_ctx.accounts,
    mock_erc20: test_ctx.mock_erc20,
    mock_erc721: test_ctx.mock_erc721,
    mock_erc1155: test_ctx.mock_erc1155,
    payment_erc20_address: test_ctx.payment_erc20_address,
    seller: seller,
    user_1_account: test_ctx.user_1_account,
    user_1_address: test_ctx.user_1_address,
    user_2_account: test_ctx.user_2_account,
    user_2_address: test_ctx.user_2_address,
    user_3_account: test_ctx.user_3_account,
    user_3_address: test_ctx.user_3_address
  };
}

export async function initSellerTestContextAndToken() : Promise<SellerTestContext> {
  const test_ctx: SellerTestContext = await initSellerTestContext();
  await initTokens(
    test_ctx.accounts,
    test_ctx.seller.address,
    test_ctx.mock_erc20,
    test_ctx.mock_erc721,
    test_ctx.mock_erc1155,
    test_ctx.user_1_account,
    test_ctx.user_2_account,
    test_ctx.user_3_account
  );

  return test_ctx;
}

export async function initSellerTestContextAndCreate() : Promise<SellerTestContext> {
  const test_ctx: SellerTestContext = await initSellerTestContextAndToken();
  const erc20_amount: number = constants.ERC20_TOKEN_SUPPLY / 10;
  const nft_id: number = 0;

  await test_ctx.seller.createERC721Sale(
    test_ctx.mock_erc721.address,
    nft_id,
    test_ctx.mock_erc20.address,
    erc20_amount
  );
  await test_ctx.seller.createERC1155Sale(
    test_ctx.mock_erc1155.address,
    nft_id,
    constants.ERC1155_TOKEN_AMOUNT,
    test_ctx.mock_erc20.address,
    erc20_amount
  );

  return test_ctx;
}

export async function deploySellerContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsSeller");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function deploySellerUpgradedContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsSellerUpgraded");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function getSellerUpgradedContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsSellerUpgraded");
  return contract_factory.attach(address);
}

//
// Not exported functions
//

async function getSellerContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsSeller");
  return contract_factory.attach(address);
}

async function deploySellerProxyContract(
  paymentERC20Address: string
) : Promise<Contract> {
  const seller_logic_instance: Contract = await deploySellerContract();
  const proxy_instance: Contract = await deployProxyContract(seller_logic_instance, paymentERC20Address);

  return getSellerContractAt(proxy_instance.address);
}
