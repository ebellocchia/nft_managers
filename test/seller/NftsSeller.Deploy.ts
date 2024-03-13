import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "../common/Constants";
import {
  SellerTestContext,
  deploySellerContract, deploySellerUpgradedContract,
  getSellerUpgradedContractAt, initSellerTestContext
} from "./UtilsSeller";


describe("NftsSeller.Deploy", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContext();
  });

  it("should be constructed correctly", async () => {
    const owner_address: string = await test_ctx.accounts.owner.getAddress();

    expect(await test_ctx.seller.owner()).to.equal(owner_address);
    expect(await test_ctx.seller.paymentERC20Address()).to.equal(test_ctx.payment_erc20_address);
  });

  it("should upgrade the logic", async () => {
    const new_logic: Contract = await deploySellerUpgradedContract();

    await expect(await test_ctx.seller.upgradeToAndCall(new_logic.address, constants.EMPTY_BYTES))
      .not.to.be.reverted;

    test_ctx.seller = await getSellerUpgradedContractAt(test_ctx.seller.address);  // Update ABI
    expect(await test_ctx.seller.isUpgraded())
      .to.equal(true);
  });

  it("should revert if initializing more than once", async () => {
    await expect(test_ctx.seller.init(constants.NULL_ADDRESS))
      .to.be.revertedWithCustomError(test_ctx.seller, "InvalidInitialization");
  });

  it("should revert if initializing the logic contract without a proxy", async () => {
    const nft: Contract = await deploySellerContract();
    await expect(nft.init(constants.NULL_ADDRESS))
      .to.be.revertedWithCustomError(test_ctx.seller, "InvalidInitialization");
  });

  it("should revert if initializing with a null address", async () => {
    const seller_logic_instance: Contract = await deploySellerContract();
    const proxy_contract_factory: ContractFactory = await hre.ethers.getContractFactory("ERC1967Proxy");
    await expect(proxy_contract_factory
      .deploy(
        seller_logic_instance.address,
        seller_logic_instance.interface.encodeFunctionData(
          "init",
          [constants.NULL_ADDRESS]
        )
      )
    )
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");
  });
});
