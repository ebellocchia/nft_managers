import { expect } from "chai";
// Project
import * as constants from "../common/Constants";
import {
  testERC721Withdraw, testERC1155Withdraw,
  testERC721WithdrawNullAddress, testERC721WithdrawInvalidId,
  testERC1155WithdrawNullAddress, testERC1155WithdrawInvalidId, testERC1155WithdrawInvalidAmount
} from "../common/TestWithdraw";
import { SellerTestContext, initSellerTestContextAndToken } from "./UtilsSeller";


describe("NftsSeller.Withdraw", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContextAndToken();
  });

  it("should withdraw a ERC721 token", async () => {
    await testERC721Withdraw(
      test_ctx.seller,
      test_ctx
    );
  });

  it("should withdraw a ERC1155 token", async () => {
    await testERC1155Withdraw(
      test_ctx.seller,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC721 token with null address", async () => {
    await testERC721WithdrawNullAddress(
      test_ctx.seller
    );
  });

  it("should revert if withdrawing a ERC721 token with an invalid token ID", async () => {
    await testERC721WithdrawInvalidId(
      test_ctx.seller,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC1155 token with null address", async () => {
    await testERC1155WithdrawNullAddress(
      test_ctx.seller
    );
  });

  it("should revert if withdrawing a ERC1155 token with an invalid token ID", async () => {
    await testERC1155WithdrawInvalidId(
      test_ctx.seller,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC1155 token with an invalid amount", async () => {
    await testERC1155WithdrawInvalidAmount(
      test_ctx.seller,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC721 token whose sale is created", async () => {
    const nft_id: number = 0;

    await test_ctx.seller.createERC721Sale(
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      1
    );

    await expect(test_ctx.seller.withdrawERC721(
      test_ctx.mock_erc721.address,
      nft_id
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "WithdrawError")
      .withArgs(
        test_ctx.mock_erc721.address,
        nft_id
      );
  });

  it("should revert if withdrawing a ERC1155 token with a higher amount than the created one", async () => {
    const withdrawable_amount: number = 2;
    const nft_amount: number = constants.ERC1155_TOKEN_AMOUNT - withdrawable_amount;
    const nft_id: number = 0;
    const owner_address: string = await test_ctx.accounts.owner.getAddress();

    await test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      nft_id,
      nft_amount,
      test_ctx.mock_erc20.address,
      1
    );

    // More than withdrawable amount
    await expect(test_ctx.seller.withdrawERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      withdrawable_amount + 1
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "WithdrawError")
      .withArgs(
        test_ctx.mock_erc1155.address,
        nft_id
      );

    // Equal to withdrawable amount
    await expect(test_ctx.seller.withdrawERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      withdrawable_amount
    ))
      .not.to.be.reverted;
    expect(await test_ctx.mock_erc1155.balanceOf(owner_address, nft_id))
      .to.equal(withdrawable_amount);
  });
});
