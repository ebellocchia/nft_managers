import { expect } from "chai";
import { Contract } from "ethers";
// Project
import * as constants from "../common/Constants";
import { Redeem, RedeemerTestContext, initRedeemerTestContextAndCreate } from "./UtilsRedeemer";


async function testRemove(
  redeemer: Contract,
  mock_token: Contract,
  user_address: string
) : Promise<void> {
  const redeem_data_before = await redeemer.Redeems(user_address);

  await expect(await redeemer.removeRedeem(user_address))
    .to.emit(redeemer, "RedeemRemoved")
    .withArgs(
      user_address,
      redeem_data_before.nftContract,
      redeem_data_before.nftId
    );

  expect(await redeemer.Redeemers(mock_token.address, redeem_data_before.nftId))
    .to.equal(constants.NULL_ADDRESS);

  const redeem_data_after: Redeem = await redeemer.Redeems(user_address);
  expect(redeem_data_after.nftContract).to.equal(redeem_data_before.nftContract);
  expect(redeem_data_after.nftId).to.equal(redeem_data_before.nftId);
  expect(redeem_data_after.nftAmount).to.equal(redeem_data_before.nftAmount);
  expect(redeem_data_after.erc20Contract).to.equal(redeem_data_before.erc20Contract);
  expect(redeem_data_after.erc20Amount).to.equal(redeem_data_before.erc20Amount);
  expect(redeem_data_after.isActive).to.equal(false);
}

describe("NftsRedeemer.Remove", () => {
  let test_ctx: RedeemerTestContext;

  beforeEach(async () => {
    test_ctx = await initRedeemerTestContextAndCreate();
  });

  it("should remove a token to be redeemed", async () => {
    await testRemove(
      test_ctx.redeemer,
      test_ctx.mock_erc721,
      test_ctx.user_1_address
    );
    await testRemove(
      test_ctx.redeemer,
      test_ctx.mock_erc1155,
      test_ctx.user_2_address
    );
  });

  it("should revert if removing a token redeem that is not created", async () => {
    await expect(test_ctx.redeemer.removeRedeem(test_ctx.user_3_address))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "RedeemNotCreatedError")
      .withArgs(test_ctx.user_3_address);
  });

  it("should revert if removing a token redeem with null addresses", async () => {
    await expect(test_ctx.redeemer.removeRedeem(constants.NULL_ADDRESS))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");
  });
});
