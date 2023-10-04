import { Contract, ContractFactory, Signer } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "./Constants";


//
// Interfaces
//

export interface Accounts {
  signers: Signer[];
  owner: Signer;
}

export interface TestContext {
  accounts: Accounts;
  mock_erc20: Contract;
  mock_erc721: Contract;
  mock_erc1155: Contract;
  payment_erc20_address: string;
  user_1_account: Signer;
  user_1_address: string;
  user_2_account: Signer;
  user_2_address: string;
  user_3_account: Signer;
  user_3_address: string;
}

//
// Exported functions
//

export async function initTestContext() : Promise<TestContext> {
  const accounts: Accounts = await initAccounts();

  const payment_erc20_address: string = await accounts.owner.getAddress();
  const mock_erc20: Contract = await deployMockERC20TokenContract();
  const mock_erc721: Contract = await deployMockERC721TokenContract();
  const mock_erc1155: Contract = await deployMockERC1155TokenContract();
  const user_1_account: Signer = accounts.signers[0];
  const user_1_address: string = await user_1_account.getAddress();
  const user_2_account: Signer = accounts.signers[1];
  const user_2_address: string = await user_2_account.getAddress();
  const user_3_account: Signer = accounts.signers[2];
  const user_3_address: string = await user_3_account.getAddress();

  return {
    accounts,
    mock_erc20,
    mock_erc721,
    mock_erc1155,
    payment_erc20_address,
    user_1_account,
    user_1_address,
    user_2_account,
    user_2_address,
    user_3_account,
    user_3_address
  };
}

export async function initTokens(
  accounts: Accounts,
  nftTargetAddr: string,
  erc20Token: Contract,
  erc721Token: Contract,
  erc1155Token: Contract,
  user_1: Signer,
  user_2: Signer,
  user_3: Signer
) : Promise<void> {
  const owner_address = await accounts.owner.getAddress();
  const user_1_address = await user_1.getAddress();
  const user_2_address = await user_2.getAddress();
  const user_3_address = await user_3.getAddress();

  // Approve ERC20 tokens for users
  await erc20Token
    .connect(user_1)
    .approve(nftTargetAddr, constants.UINT256_MAX);
  await erc20Token
    .connect(user_2)
    .approve(nftTargetAddr, constants.UINT256_MAX);
  await erc20Token
    .connect(user_3)
    .approve(nftTargetAddr, constants.UINT256_MAX);
  // Transfer ERC20 tokens to users
  await erc20Token
    .connect(accounts.owner)
    .transfer(user_1_address, constants.ERC20_TOKEN_SUPPLY / 2);
  await erc20Token
    .connect(accounts.owner)
    .transfer(user_2_address, constants.ERC20_TOKEN_SUPPLY / 2);
  // Mint ERC721 tokens (one to the owner to test for ownership)
  for (let i = 0; i < constants.ERC721_TOKEN_SUPPLY - 1; i++) {
    await erc721Token.mintTo(nftTargetAddr, i);
  }
  await erc721Token.mintTo(owner_address, constants.ERC721_TOKEN_SUPPLY);
  // Mint ERC1155 tokens
  for (let i = 0; i < constants.ERC1155_TOKEN_SUPPLY; i++) {
    await erc1155Token.mint(nftTargetAddr, i, constants.ERC1155_TOKEN_AMOUNT);
  }
}

export async function deployProxyContract(
  logicInstance: Contract,
  paymentERC20Address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("ERC1967Proxy");
  const instance: Contract = await contract_factory
    .deploy(
      logicInstance.address,
      logicInstance.interface.encodeFunctionData(
        "init",
        [paymentERC20Address]
      )
    );
  await instance.deployed();

  return instance;
}

export async function getMockERC20TokenContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20Token");
  return contract_factory.attach(address);
}

export async function getMockERC721TokenContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC721Token");
  return contract_factory.attach(address);
}

export async function getMockERC1155TokenContractAt(
  address: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC1155Token");
  return contract_factory.attach(address);
}

export async function deployMockERC20ReceiverContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20Receiver");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function deployMockERC20ReceiverRetValErrContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20ReceiverRetValErr");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

export async function deployMockERC20ReceiverNotImplContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20ReceiverNotImpl");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

//
// Not exported functions
//

async function initAccounts() : Promise<Accounts> {
  const all_signers: Signer[] = await hre.ethers.getSigners();

  const owner: Signer = all_signers[0];
  const signers: Signer[] = [];
  for (let i = 1; i < all_signers.length; i++) {
    signers.push(all_signers[i])
  }

  return {
    owner,
    signers,
  };
}

async function deployMockERC20TokenContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20Token");
  const instance: Contract = await contract_factory.deploy(constants.ERC20_TOKEN_SUPPLY);
  await instance.deployed();

  return instance;
}

async function deployMockERC721TokenContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC721Token");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deployMockERC1155TokenContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC1155Token");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}
