import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "../common/Constants";
import {
  RedeemerTestContext,
  deployRedeemerContract, deployRedeemerUpgradedContract,
  getRedeemerUpgradedContractAt, initRedeemerTestContext
} from "./UtilsRedeemer";


describe("NftsRedeemer.Deploy", () => {
  let test_ctx: RedeemerTestContext;

  beforeEach(async () => {
    test_ctx = await initRedeemerTestContext();
  });

  it("should be constructed correctly", async () => {
    const owner_address: string = await test_ctx.accounts.owner.getAddress();

    expect(await test_ctx.redeemer.owner()).to.equal(owner_address);
    expect(await test_ctx.redeemer.paymentERC20Address()).to.equal(test_ctx.payment_erc20_address);
  });

  it("should upgrade the logic", async () => {
    const new_logic: Contract = await deployRedeemerUpgradedContract();

    await expect(await test_ctx.redeemer.upgradeTo(new_logic.address))
      .not.to.be.reverted;

    test_ctx.redeemer = await getRedeemerUpgradedContractAt(test_ctx.redeemer.address);  // Update ABI
    expect(await test_ctx.redeemer.isUpgraded())
      .to.equal(true);
  });

  it("should revert if initializing more than once", async () => {
    await expect(test_ctx.redeemer.init(constants.NULL_ADDRESS))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initializing the logic contract without a proxy", async () => {
    const nft: Contract = await deployRedeemerContract();
    await expect(nft.init(constants.NULL_ADDRESS))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initializing with a null address", async () => {
    const redeemer_logic_instance: Contract = await deployRedeemerContract();
    const proxy_contract_factory: ContractFactory = await hre.ethers.getContractFactory("ERC1967Proxy");
    await expect(proxy_contract_factory
      .deploy(
        redeemer_logic_instance.address,
        redeemer_logic_instance.interface.encodeFunctionData(
          "init", 
          [constants.NULL_ADDRESS]
        )
      )
    )
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");
  });
});
