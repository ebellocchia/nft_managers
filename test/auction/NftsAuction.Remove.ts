import { expect } from "chai";
import { Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// Project
import * as constants from "../common/Constants";
import {
  Auction, AuctionStates,
  AuctionTestContext, initAuctionTestContextAndCreate
} from "./UtilsAuction";


async function testRemove(
  auction: Contract,
  mock_nft: Contract
) : Promise<void> {
  const nft_id: number = 0;
  const auction_data_before: Auction = await auction.Auctions(mock_nft.address, nft_id);

  await expect(await auction.removeAuction(
    mock_nft.address,
    nft_id
  ))
    .to.emit(auction, "AuctionRemoved")
    .withArgs(
      mock_nft.address,
      nft_id
    );

  const auction_data_after: Auction = await auction.Auctions(mock_nft.address, nft_id);
  expect(auction_data_after.nftAmount).to.equal(auction_data_before.nftAmount);
  expect(auction_data_after.highestBidder).to.equal(auction_data_before.highestBidder);
  expect(auction_data_after.erc20Contract).to.equal(auction_data_before.erc20Contract);
  expect(auction_data_after.erc20StartPrice).to.equal(auction_data_before.erc20StartPrice);
  expect(auction_data_after.erc20MinimumBidIncrement).to.equal(auction_data_before.erc20MinimumBidIncrement);
  expect(auction_data_after.erc20HighestBid).to.equal(auction_data_before.erc20HighestBid);
  expect(auction_data_after.startTime).to.equal(auction_data_before.startTime);
  expect(auction_data_after.endTime).to.equal(auction_data_before.endTime);
  expect(auction_data_after.state).to.equal(AuctionStates.INACTIVE);
}

async function testRemoveExpired(
  auction: Contract,
  mock_nft: Contract
) : Promise<void> {
  const nft_id: number = 0;
  const auction_data: Auction = await auction.Auctions(mock_nft.address, nft_id);

  await time.increase(auction_data.endTime.sub(auction_data.startTime));

  await testRemove(auction, mock_nft);
}

async function testRemoveNotCreated(
  auction: Contract,
  mock_nft: Contract
) : Promise<void> {
  const nft_id: number = 1;

  await expect(auction.removeAuction(
    mock_nft.address,
    nft_id
  ))
    .to.be.revertedWithCustomError(auction, "AuctionNotActiveError")
    .withArgs(
      mock_nft.address,
      nft_id
    );
}

describe("NftsAuction.Remove", () => {
  let test_ctx: AuctionTestContext;

  beforeEach(async () => {
    test_ctx = await initAuctionTestContextAndCreate();
  });

  it("should remove a token auction", async () => {
    await testRemove(
      test_ctx.auction,
      test_ctx.mock_erc721
    );
    await testRemove(
      test_ctx.auction,
      test_ctx.mock_erc1155
    );
  });

  it("should remove an expired token auction", async () => {
    await testRemoveExpired(
      test_ctx.auction,
      test_ctx.mock_erc721
    );
    await testRemoveExpired(
      test_ctx.auction,
      test_ctx.mock_erc1155
    );
  });

  it("should revert if removing a token auction that is not created", async () => {
    await testRemoveNotCreated(
      test_ctx.auction,
      test_ctx.mock_erc721
    );
    await testRemoveNotCreated(
      test_ctx.auction,
      test_ctx.mock_erc1155
    );
  });

  it("should revert if removing a token auction with null addresses", async () => {
    await expect(test_ctx.auction.removeAuction(constants.NULL_ADDRESS, 0))
      .to.be.revertedWithCustomError(test_ctx.auction, "NullAddressError");
  });
});
