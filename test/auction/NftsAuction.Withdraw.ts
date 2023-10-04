import { expect } from "chai";
// Project
import * as constants from "../common/Constants";
import {
  testERC721Withdraw, testERC1155Withdraw,
  testERC721WithdrawNullAddress, testERC721WithdrawInvalidId,
  testERC1155WithdrawNullAddress, testERC1155WithdrawInvalidId, testERC1155WithdrawInvalidAmount
} from "../common/TestWithdraw";
import { AuctionTestContext, initAuctionTestContextAndToken } from "./UtilsAuction";


describe("NftsAuction.Withdraw", () => {
  let test_ctx: AuctionTestContext;

  beforeEach(async () => {
    test_ctx = await initAuctionTestContextAndToken();
  });

  it("should withdraw a ERC721 token", async () => {
    await testERC721Withdraw(
      test_ctx.auction,
      test_ctx
    );
  });

  it("should withdraw a ERC1155 token", async () => {
    await testERC1155Withdraw(
      test_ctx.auction,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC721 token with null address", async () => {
    await testERC721WithdrawNullAddress(
      test_ctx.auction
    );
  });

  it("should revert if withdrawing a ERC721 token with an invalid token ID", async () => {
    await testERC721WithdrawInvalidId(
      test_ctx.auction,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC1155 token with null address", async () => {
    await testERC1155WithdrawNullAddress(
      test_ctx.auction
    );
  });

  it("should revert if withdrawing a ERC1155 token with an invalid token ID", async () => {
    await testERC1155WithdrawInvalidId(
      test_ctx.auction,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC1155 token with an invalid amount", async () => {
    await testERC1155WithdrawInvalidAmount(
      test_ctx.auction,
      test_ctx
    );
  });

  it("should revert if withdrawing a ERC721 token whose action is created", async () => {
    const duration_sec: number = 24 * 60 * 60;
    const erc20_start_price: number = constants.ERC20_TOKEN_SUPPLY / 10;
    const erc20_min_bid_increment: number = erc20_start_price / 100;
    const nft_id: number = 0;
  
    await test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      erc20_start_price,
      erc20_min_bid_increment,
      duration_sec,
      0
    );

    await expect(test_ctx.auction.withdrawERC721(
      test_ctx.mock_erc721.address,
      nft_id
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "WithdrawError")
      .withArgs(
        test_ctx.mock_erc721.address,
        nft_id
      );
  });

  it("should revert if withdrawing a ERC1155 token with a higher amount than the created one", async () => {
    const withdrawable_amount: number = 2;
    const duration_sec: number = 24 * 60 * 60;
    const erc20_start_price: number = constants.ERC20_TOKEN_SUPPLY / 10;
    const erc20_min_bid_increment: number = erc20_start_price / 100;
    const nft_amount: number = constants.ERC1155_TOKEN_AMOUNT - withdrawable_amount;
    const nft_id: number = 0;
    const owner_address: string = await test_ctx.accounts.owner.getAddress();
  
    await test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      nft_id,
      nft_amount,
      test_ctx.mock_erc20.address,
      erc20_start_price,
      erc20_min_bid_increment,
      duration_sec,
      0
    );

    // More than withdrawable amount
    await expect(test_ctx.auction.withdrawERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      withdrawable_amount + 1
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "WithdrawError")
      .withArgs(
        test_ctx.mock_erc1155.address,
        nft_id
      );

    // Equal to withdrawable amount
    await expect(test_ctx.auction.withdrawERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      withdrawable_amount
    ))
      .not.to.be.reverted;
    expect(await test_ctx.mock_erc1155.balanceOf(owner_address, nft_id))
      .to.equal(withdrawable_amount);
  });
});
