import { BigNumber, Contract, ContractFactory } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";


async function deployAuction(
  hre: HardhatRuntimeEnvironment
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsAuction");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deployRedeemer(
  hre: HardhatRuntimeEnvironment
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsRedeemer");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deploySeller(
  hre: HardhatRuntimeEnvironment
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("NftsSeller");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deployProxy(
  hre: HardhatRuntimeEnvironment,
  logic: Contract,
  walletAddr: string
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("ERC1967Proxy");
  const instance: Contract = await contract_factory.deploy(
    logic.address,
    logic.interface.encodeFunctionData("init", [walletAddr])
  );
  await instance.deployed();

  return instance;
}

task("deploy-test-tokens", "Deploy mock tokens (ERC20, ERC721, ERC1155)")
  .addParam("erc20Supply", "Supply of the mock ERC20 token")
  .setAction(async (taskArgs, hre) => {
    const erc20_supply: BigNumber = BigNumber.from(taskArgs.erc20Supply);

    console.log("Deploying mock tokens...");

    const erc20_contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20Token");
    const erc20_instance: Contract = await erc20_contract_factory.deploy(erc20_supply);
    await erc20_instance.deployed();

    const erc721_contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC721Token");
    const erc721_instance: Contract = await erc721_contract_factory.deploy();
    await erc721_instance.deployed();

    const erc1155_contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC1155Token");
    const erc1155_instance: Contract = await erc1155_contract_factory.deploy();
    await erc1155_instance.deployed();

    console.log(`MockERC20Token deployed to ${erc20_instance.address} with supply ${erc20_supply}`);
    console.log(`MockERC721Token deployed to ${erc721_instance.address}`);
    console.log(`MockERC1155Token deployed to ${erc1155_instance.address}`);
  });

task("deploy-all", "Deploy contract")
  .addParam("walletAddr", "Wallet address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying logic contracts...");

    const auction_logic: Contract = await deployAuction(hre);
    const redeemer_logic: Contract = await deployRedeemer(hre);
    const seller_logic: Contract = await deploySeller(hre);

    console.log("Deploying proxy contracts...");

    const auction_proxy: Contract = await deployProxy(hre, auction_logic, taskArgs.walletAddr);
    const redeemer_proxy: Contract = await deployProxy(hre, redeemer_logic, taskArgs.walletAddr);
    const seller_proxy: Contract = await deployProxy(hre, seller_logic, taskArgs.walletAddr);

    console.log(`Payment ERC20 wallet: ${taskArgs.walletAddr}`);
    console.log(`NftsAuction logic deployed to ${auction_logic.address}`);
    console.log(`NftsAuction proxy deployed to ${auction_proxy.address}`);
    console.log(`NftsRedeemer logic deployed to ${redeemer_logic.address}`);
    console.log(`NftsRedeemer proxy deployed to ${redeemer_proxy.address}`);
    console.log(`NftsSeller logic deployed to ${seller_logic.address}`);
    console.log(`NftsSeller proxy deployed to ${seller_proxy.address}`);
  });

task("deploy-auction", "Deploy auction contract")
  .addParam("walletAddr", "Wallet address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying logic contract...");

    const auction_logic: Contract = await deployAuction(hre);

    console.log("Deploying proxy contract...");

    const auction_proxy: Contract = await deployProxy(hre, auction_logic, taskArgs.walletAddr);

    console.log(`Payment ERC20 wallet: ${taskArgs.walletAddr}`);
    console.log(`NftsAuction logic deployed to ${auction_logic.address}`);
    console.log(`NftsAuction proxy deployed to ${auction_proxy.address}`);
  });

task("deploy-redeemer", "Deploy redeemer contract")
  .addParam("walletAddr", "Wallet address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying logic contract...");

    const redeemer_logic: Contract = await deployRedeemer(hre);

    console.log("Deploying proxy contract...");

    const redeemer_proxy: Contract = await deployProxy(hre, redeemer_logic, taskArgs.walletAddr);

    console.log(`Payment ERC20 wallet: ${taskArgs.walletAddr}`);
    console.log(`NftsRedeemer logic deployed to ${redeemer_logic.address}`);
    console.log(`NftsRedeemer proxy deployed to ${redeemer_proxy.address}`);
  });

task("deploy-seller", "Deploy seller contract")
  .addParam("walletAddr", "Wallet address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying logic contract...");

    const seller_logic: Contract = await deploySeller(hre);

    console.log("Deploying proxy contract...");

    const seller_proxy: Contract = await deployProxy(hre, seller_logic, taskArgs.walletAddr);

    console.log(`Payment ERC20 wallet: ${taskArgs.walletAddr}`);
    console.log(`NftsSeller logic deployed to ${seller_logic.address}`);
    console.log(`NftsSeller proxy deployed to ${seller_proxy.address}`);
  });

task("upgrade-auction-to", "Upgrade auction contract")
  .addParam("proxyAddr", "Proxy address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying new contract logic...");

    const auction_logic: Contract = await deployAuction(hre);

    console.log("Upgrading contract...");

    const proxy_instance: Contract = await (await hre.ethers.getContractFactory("NftsAuction"))
      .attach(taskArgs.proxyAddr);
    await proxy_instance.upgradeToAndCall(auction_logic.address, "0x");

    console.log(`NftsAuction updated logic deployed to ${auction_logic.address}`);
  });

task("upgrade-redeemer-to", "Upgrade redeemer contract")
  .addParam("proxyAddr", "Proxy address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying new contract logic...");

    const redeemer_logic: Contract = await deployRedeemer(hre);

    console.log("Upgrading contract...");

    const proxy_instance: Contract = await (await hre.ethers.getContractFactory("NftsRedeemer"))
      .attach(taskArgs.proxyAddr);
    await proxy_instance.upgradeToAndCall(redeemer_logic.address, "0x");

    console.log(`NftsRedeemer updated logic deployed to ${redeemer_logic.address}`);
  });

task("upgrade-seller-to", "Upgrade seller contract")
  .addParam("proxyAddr", "Proxy address")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying new contract logic...");

    const seller_logic: Contract = await deploySeller(hre);

    console.log("Upgrading contract...");

    const proxy_instance: Contract = await (await hre.ethers.getContractFactory("NftsSeller"))
      .attach(taskArgs.proxyAddr);
    await proxy_instance.upgradeToAndCall(seller_logic.address, "0x");

    console.log(`NftsSeller updated logic deployed to ${seller_logic.address}`);
  });
