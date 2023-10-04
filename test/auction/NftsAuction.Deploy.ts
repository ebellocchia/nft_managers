import { expect } from "chai";
// Project
import * as constants from "../common/Constants";
import {
  AuctionTestContext,
  deployAuctionContract, deployAuctionUpgradedContract,
  getAuctionUpgradedContractAt, initAuctionTestContext
} from "./UtilsAuction";


describe("NftsAuction.Deploy", () => {
  let test_ctx: AuctionTestContext;

  beforeEach(async () => {
    test_ctx = await initAuctionTestContext();
  });

  it("should be constructed correctly", async () => {
    const owner_address: string = await test_ctx.accounts.owner.getAddress();

    expect(await test_ctx.auction.owner()).to.equal(owner_address);
    expect(await test_ctx.auction.paymentERC20Address()).to.equal(test_ctx.payment_erc20_address);
  });

  it("should upgrade the logic", async () => {
    const new_logic = await deployAuctionUpgradedContract();

    await expect(await test_ctx.auction.upgradeTo(new_logic.address))
      .not.to.be.reverted;

    test_ctx.auction = await getAuctionUpgradedContractAt(test_ctx.auction.address);  // Update ABI
    expect(await test_ctx.auction.isUpgraded())
      .to.equal(true);
  });

  it("should revert if initializing more than once", async () => {
    await expect(test_ctx.auction.init(constants.NULL_ADDRESS))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("should revert if initializing the logic contract without a proxy", async () => {
    const nft = await deployAuctionContract();
    await expect(nft.init(constants.NULL_ADDRESS))
      .to.be.revertedWith("Initializable: contract is already initialized");
  });
});
