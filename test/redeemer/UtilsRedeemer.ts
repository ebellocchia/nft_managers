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

export interface Redeem {
  nftContract: string;
  nftId: BigNumber;
  nftAmount: BigNumber;
  erc20Contract: string;
  erc20Amount: BigNumber;
  isActive: boolean;
}

export interface RedeemerTestContext extends TestContext {
  redeemer: Contract;
}

//
// Exported functions
//

export async function initRedeemerTestContext() : Promise<RedeemerTestContext> {
  const test_ctx: TestContext = await initTestContext();
  const redeemer: Contract = await deployRedeemerProxyContract(test_ctx.payment_erc20_address);

  return {
    accounts: test_ctx.accounts,
    mock_erc20: test_ctx.mock_erc20,
    mock_erc721: test_ctx.mock_erc721,
    mock_erc1155: test_ctx.mock_erc1155,
    payment_erc20_address: test_ctx.payment_erc20_address,
    redeemer: redeemer,
    user_1_account: test_ctx.user_1_account,
    user_1_address: test_ctx.user_1_address,
    user_2_account: test_ctx.user_2_account,
    user_2_address: test_ctx.user_2_address,
    user_3_account: test_ctx.user_3_account,
    user_3_address: test_ctx.user_3_address
  };
}

export async function initRedeemerTestContextAndToken() : Promise<RedeemerTestContext> {
  const test_ctx: RedeemerTestContext = await initRedeemerTestContext();
  await initTokens(
    test_ctx.accounts,
    test_ctx.redeemer.address,
    test_ctx.mock_erc20,
    test_ctx.mock_erc721,
    test_ctx.mock_erc1155,
    test_ctx.user_1_account,
    test_ctx.user_2_account,
    test_ctx.user_3_account
  );

  return test_ctx;
}

export async function initRedeemerTestContextAndCreate() : Promise<RedeemerTestContext> {
  const test_ctx: RedeemerTestContext = await initRedeemerTestContextAndToken();
  const erc20_amount: number = constants.ERC20_TOKEN_SUPPLY / 10;
  const nft_id: number = 0;

  await test_ctx.redeemer.createERC721Redeem(
    test_ctx.user_1_address,
    test_ctx.mock_erc721.address,
    nft_id,
    test_ctx.mock_erc20.address,
    erc20_amount
  );
  await test_ctx.redeemer.createERC1155Redeem(
    test_ctx.user_2_address,
    test_ctx.mock_erc1155.address,
    nft_id,
    constants.ERC1155_TOKEN_AMOUNT,
    test_ctx.mock_erc20.address,
    erc20_amount
  );

  return test_ctx;
}

export async function deployRedeemerContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsRedeemer");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function deployRedeemerUpgradedContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsRedeemerUpgraded");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function getRedeemerUpgradedContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsRedeemerUpgraded");
  return contract_factory.attach(address);
}

//
// Not exported functions
//

async function getRedeemerContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsRedeemer");
  return contract_factory.attach(address);
}

async function deployRedeemerProxyContract(
  paymentERC20Address: string
) : Promise<Contract> {
  const redeemer_logic_instance: Contract = await deployRedeemerContract();
  const proxy_instance: Contract = await deployProxyContract(redeemer_logic_instance, paymentERC20Address);

  return getRedeemerContractAt(proxy_instance.address);
}
