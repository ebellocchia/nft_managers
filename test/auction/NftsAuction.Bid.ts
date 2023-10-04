import { expect } from "chai";
import { BigNumber, Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// Project
import * as constants from "../common/Constants";
import { getMockERC20TokenContractAt } from "../common/UtilsCommon";
import {
  Auction, AuctionStates, 
  AuctionTestContext, initAuctionTestContextAndCreate 
} from "./UtilsAuction";


async function testBid(
  auction: Contract,
  mock_nft: Contract,
  user_1_account: Signer,
  user_2_account: Signer
) : Promise<void> {
  const nft_id: number = 0;
  const auction_data_before: Auction = await auction.Auctions(mock_nft.address, nft_id);
  const bid_1_amount: BigNumber = auction_data_before.erc20StartPrice.add(auction_data_before.erc20MinimumBidIncrement);
  const bid_2_amount: BigNumber = bid_1_amount.add(auction_data_before.erc20MinimumBidIncrement);
  const user_1_address: string = await user_1_account.getAddress();
  const user_2_address: string = await user_2_account.getAddress();

  // First bid
  await expect(await auction.connect(user_1_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    bid_1_amount
  ))
    .to.emit(auction, "AuctionBid")
    .withArgs(
      mock_nft.address,
      nft_id,
      user_1_address,
      auction_data_before.erc20Contract,
      bid_1_amount
    );

  const auction_data_after_1: Auction = await auction.Auctions(mock_nft.address, nft_id);
  expect(auction_data_after_1.nftAmount).to.equal(auction_data_before.nftAmount);
  expect(auction_data_after_1.highestBidder).to.equal(user_1_address);
  expect(auction_data_after_1.erc20Contract).to.equal(auction_data_before.erc20Contract);
  expect(auction_data_after_1.erc20StartPrice).to.equal(auction_data_before.erc20StartPrice);
  expect(auction_data_after_1.erc20MinimumBidIncrement).to.equal(auction_data_before.erc20MinimumBidIncrement);
  expect(auction_data_after_1.erc20HighestBid).to.equal(bid_1_amount);
  expect(auction_data_after_1.startTime).to.equal(auction_data_before.startTime);
  expect(auction_data_after_1.endTime).to.equal(auction_data_before.endTime);
  expect(auction_data_after_1.state).to.equal(AuctionStates.ACTIVE);

  // Second bid
  await expect(await auction.connect(user_2_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    bid_2_amount
  ))
    .to.emit(auction, "AuctionBid")
    .withArgs(
      mock_nft.address,
      nft_id,
      user_2_address,
      auction_data_before.erc20Contract,
      bid_2_amount
    );

  const auction_data_after_2: Auction = await auction.Auctions(mock_nft.address, nft_id);
  expect(auction_data_after_2.nftAmount).to.equal(auction_data_before.nftAmount);
  expect(auction_data_after_2.highestBidder).to.equal(user_2_address);
  expect(auction_data_after_2.erc20Contract).to.equal(auction_data_before.erc20Contract);
  expect(auction_data_after_2.erc20StartPrice).to.equal(auction_data_before.erc20StartPrice);
  expect(auction_data_after_2.erc20MinimumBidIncrement).to.equal(auction_data_before.erc20MinimumBidIncrement);
  expect(auction_data_after_2.erc20HighestBid).to.equal(bid_2_amount);
  expect(auction_data_after_2.startTime).to.equal(auction_data_before.startTime);
  expect(auction_data_after_2.endTime).to.equal(auction_data_before.endTime);
  expect(auction_data_after_2.state).to.equal(AuctionStates.ACTIVE);

  expect(await auction.isAuctionActive(mock_nft.address, nft_id))
    .to.equal(true);
  expect(await auction.isAuctionExpired(mock_nft.address, nft_id))
    .to.equal(false);
  expect(await auction.isAuctionCompleted(mock_nft.address, nft_id))
    .to.equal(false);
}

async function testBidExtension(
  auction: Contract,
  mock_nft: Contract,
  user_account: Signer
) : Promise<void> {
  const nft_id: number = 0;
  const auction_data_before: Auction = await auction.Auctions(mock_nft.address, nft_id);
  const bid_1_amount: BigNumber = auction_data_before.erc20StartPrice.add(auction_data_before.erc20MinimumBidIncrement);
  const bid_2_amount: BigNumber = bid_1_amount.add(auction_data_before.erc20MinimumBidIncrement);
  const user_address: string = await user_account.getAddress();

  // Not enough for triggering time extension
  await time.increase(
    auction_data_before.endTime
      .sub(auction_data_before.startTime)
      .sub(auction_data_before.extendTimeSec)
      .sub(2)
  );

  await auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    bid_1_amount
  );

  const auction_data_after_1: Auction = await auction.Auctions(mock_nft.address, nft_id);
  expect(auction_data_after_1.nftAmount).to.equal(auction_data_before.nftAmount);
  expect(auction_data_after_1.highestBidder).to.equal(user_address);
  expect(auction_data_after_1.erc20Contract).to.equal(auction_data_before.erc20Contract);
  expect(auction_data_after_1.erc20StartPrice).to.equal(auction_data_before.erc20StartPrice);
  expect(auction_data_after_1.erc20MinimumBidIncrement).to.equal(auction_data_before.erc20MinimumBidIncrement);
  expect(auction_data_after_1.erc20HighestBid).to.equal(bid_1_amount);
  expect(auction_data_after_1.startTime).to.equal(auction_data_before.startTime);
  expect(auction_data_after_1.endTime).to.equal(auction_data_before.endTime);
  expect(auction_data_after_1.state).to.equal(AuctionStates.ACTIVE);

  // Enough for triggering time extension
  await time.increase(1);

  await auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    bid_2_amount
  );

  const auction_data_after_2: Auction = await auction.Auctions(mock_nft.address, nft_id);
  expect(auction_data_after_2.nftAmount).to.equal(auction_data_before.nftAmount);
  expect(auction_data_after_2.highestBidder).to.equal(user_address);
  expect(auction_data_after_2.erc20Contract).to.equal(auction_data_before.erc20Contract);
  expect(auction_data_after_2.erc20StartPrice).to.equal(auction_data_before.erc20StartPrice);
  expect(auction_data_after_2.erc20MinimumBidIncrement).to.equal(auction_data_before.erc20MinimumBidIncrement);
  expect(auction_data_after_2.erc20HighestBid).to.equal(bid_2_amount);
  expect(auction_data_after_2.startTime).to.equal(auction_data_before.startTime);
  expect(auction_data_after_2.endTime).to.equal(auction_data_before.endTime.add(auction_data_before.extendTimeSec));
  expect(auction_data_after_2.state).to.equal(AuctionStates.ACTIVE);
}

async function testBidNotCreated(
  auction: Contract,
  mock_nft: Contract,
  user_account: Signer
) : Promise<void> {
  const nft_id: number = 1;

  await expect(auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    1
  ))
    .to.revertedWithCustomError(auction, "AuctionNotActiveError")
    .withArgs(
      mock_nft.address,
      nft_id
    );
}

async function testBidExpired(
  auction: Contract,
  mock_nft: Contract,
  user_account: Signer
) : Promise<void> {
  const nft_id: number = 0;
  const auction_data: Auction = await auction.Auctions(mock_nft.address, nft_id);

  await time.increase(auction_data.endTime.sub(auction_data.startTime).add(1));

  expect(await auction.isAuctionActive(mock_nft.address, nft_id))
    .to.equal(false);
  expect(await auction.isAuctionExpired(mock_nft.address, nft_id))
    .to.equal(true);

  await expect(auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    1
  ))
    .to.revertedWithCustomError(auction, "AuctionNotActiveError")
    .withArgs(
      mock_nft.address,
      nft_id
    );
}

async function testBidInvalidAmounts(
  auction: Contract,
  mock_nft: Contract,
  user_account: Signer,
  user_address: string
) : Promise<void> {
  const nft_id: number = 0;
  const auction_data: Auction = await auction.Auctions(mock_nft.address, nft_id);

  // Amount less than highest bid
  await expect(auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    auction_data.erc20HighestBid.sub(1)
  ))
    .to.revertedWithCustomError(auction, "AmountError");

  // Amount less than minimum bid increment
  await expect(auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    auction_data.erc20HighestBid.add(auction_data.erc20MinimumBidIncrement).sub(1)
  ))
    .to.revertedWithCustomError(auction, "AmountError");

  // Amount higher than the user balance
  const mock_erc20: Contract = await getMockERC20TokenContractAt(auction_data.erc20Contract);
  await expect(auction.connect(user_account).bidAtAuction(
    mock_nft.address,
    nft_id,
    (await mock_erc20.balanceOf(user_address)).add(1)
  ))
    .to.revertedWithCustomError(auction, "AmountError");
}

describe("NftsAuction.Bid", () => {
  let test_ctx: AuctionTestContext;

  beforeEach(async () => {
    test_ctx = await initAuctionTestContextAndCreate();
  });

  it("should allow the user to bid for a token auction", async () => {
    await testBid(
      test_ctx.auction,
      test_ctx.mock_erc721,
      test_ctx.user_1_account,
      test_ctx.user_2_account
    );
    await testBid(
      test_ctx.auction,
      test_ctx.mock_erc1155,
      test_ctx.user_1_account,
      test_ctx.user_2_account
    );
  });

  it("should extend the auction if a user bid when it is expiring (ERC721)", async () => {
    await testBidExtension(
      test_ctx.auction,
      test_ctx.mock_erc721,
      test_ctx.user_1_account
    );
  });

  it("should extend the auction if a user bid when it is expiring (ERC1155)", async () => {
    await testBidExtension(
      test_ctx.auction,
      test_ctx.mock_erc1155,
      test_ctx.user_1_account
    );
  });

  it("should revert if bidding for a token auction that is not created", async () => {
    await testBidNotCreated(
      test_ctx.auction,
      test_ctx.mock_erc721,
      test_ctx.user_1_account
    );

    await testBidNotCreated(
      test_ctx.auction,
      test_ctx.mock_erc1155,
      test_ctx.user_1_account
    );
  });

  it("should revert if bidding for a token auction that is expired (ERC721)", async () => {
    await testBidExpired(
      test_ctx.auction,
      test_ctx.mock_erc721,
      test_ctx.user_1_account
    );
  });

  it("should revert if bidding for a token auction that is expired (ERC1155)", async () => {
    await testBidExpired(
      test_ctx.auction,
      test_ctx.mock_erc1155,
      test_ctx.user_1_account
    );
  });

  it("should revert if bidding for a token auction with invalid amounts", async () => {
    await testBidInvalidAmounts(
      test_ctx.auction,
      test_ctx.mock_erc721,
      test_ctx.user_1_account,
      test_ctx.user_1_address
    );

    await testBidInvalidAmounts(
      test_ctx.auction,
      test_ctx.mock_erc1155,
      test_ctx.user_1_account,
      test_ctx.user_1_address
    );
  });

  it("should revert if bidding for a token auction with null addresses", async () => {
    await expect(test_ctx.auction.connect(test_ctx.user_1_account).bidAtAuction(
      constants.NULL_ADDRESS,
      0,
      1
    ))
      .to.revertedWithCustomError(test_ctx.auction, "NullAddressError");
  });
});
