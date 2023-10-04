import { expect } from "chai";
import { Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// Project
import * as constants from "../common/Constants";
import {
  Auction, AuctionStates, 
  AuctionTestContext, initAuctionTestContextAndToken
} from "./UtilsAuction";


async function testCreate(
  auction: Contract,
  mock_nft: Contract,
  mock_erc20: Contract
) : Promise<void> {
  const is_erc721: boolean = await mock_nft.supportsInterface(constants.ERC721_INTERFACE_ID);
  const duration_sec: number = 60 * 60;
  const extend_time_sec: number = 60;
  const erc20_start_price: number = 100;
  const erc20_min_bid_increment: number = 10;
  const nft_amount: number = is_erc721 ? 0 : 1;
  const nft_id: number = 0;

  if (is_erc721) {
    await expect(await auction.createERC721Auction(
      mock_nft.address,
      nft_id,
      mock_erc20.address,
      erc20_start_price,
      erc20_min_bid_increment,
      duration_sec,
      extend_time_sec
    ))
      .to.emit(auction, "AuctionCreated")
      .withArgs(
        mock_nft.address,
        nft_id,
        nft_amount,
        mock_erc20.address,
        erc20_start_price,
        erc20_min_bid_increment,
        await time.latest(),
        duration_sec,
        extend_time_sec
      );
  }
  else {
    await expect(await auction.createERC1155Auction(
      mock_nft.address,
      nft_id,
      nft_amount,
      mock_erc20.address,
      erc20_start_price,
      erc20_min_bid_increment,
      duration_sec,
      extend_time_sec
    ))
      .to.emit(auction, "AuctionCreated")
      .withArgs(
        mock_nft.address,
        nft_id,
        nft_amount,
        mock_erc20.address,
        erc20_start_price,
        erc20_min_bid_increment,
        await time.latest(),
        duration_sec,
        extend_time_sec
      );
  }

  const curr_time: number = await time.latest();
  const auction_data: Auction = await auction.Auctions(mock_nft.address, nft_id);
  expect(auction_data.nftAmount).to.equal(nft_amount);
  expect(auction_data.highestBidder).to.equal(constants.NULL_ADDRESS);
  expect(auction_data.erc20Contract).to.equal(mock_erc20.address);
  expect(auction_data.erc20StartPrice).to.equal(erc20_start_price);
  expect(auction_data.erc20MinimumBidIncrement).to.equal(erc20_min_bid_increment);
  expect(auction_data.erc20HighestBid).to.equal(erc20_start_price);
  expect(auction_data.startTime).to.equal(curr_time);
  expect(auction_data.endTime).to.equal(curr_time + duration_sec);
  expect(auction_data.state).to.equal(AuctionStates.ACTIVE);

  expect(await auction.isAuctionActive(mock_nft.address, nft_id))
    .to.equal(true);
  expect(await auction.isAuctionExpired(mock_nft.address, nft_id))
    .to.equal(false);
}

describe("NftsAuction.Create", () => {
  let test_ctx: AuctionTestContext;

  beforeEach(async () => {
    test_ctx = await initAuctionTestContextAndToken();
  });

  it("should create a token auction", async () => {
    await testCreate(
      test_ctx.auction,
      test_ctx.mock_erc721,
      test_ctx.mock_erc20
    );
    await testCreate(
      test_ctx.auction,
      test_ctx.mock_erc1155,
      test_ctx.mock_erc20
    );
  });

  it("should revert if creating a ERC721 token auction with null addresses", async () => {
    await expect(test_ctx.auction.createERC721Auction(
      constants.NULL_ADDRESS,
      0,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NullAddressError");

    await expect(test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      0,
      constants.NULL_ADDRESS,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NullAddressError");
  });

  it("should revert if creating a ERC1155 token auction with null addresses", async () => {
    await expect(test_ctx.auction.createERC1155Auction(
      constants.NULL_ADDRESS,
      0,
      1,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NullAddressError");

    await expect(test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      0,
      1,
      constants.NULL_ADDRESS,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NullAddressError");
  });

  it("should revert if creating a ERC721 token auction that is already existent", async () => {
    await test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    );
    await expect(test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "AuctionAlreadyActiveError")
      .withArgs(test_ctx.mock_erc721.address, 0);
  });

  it("should revert if creating a ERC1155 token auction that is already existent", async () => {
    await test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    );
    await expect(test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "AuctionAlreadyActiveError")
      .withArgs(test_ctx.mock_erc1155.address, 0);
  });

  it("should revert if creating a ERC721 token auction with an invalid ID", async () => {
    const nft_id: number = constants.ERC721_TOKEN_SUPPLY;

    await expect(test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NftError")
      .withArgs(test_ctx.mock_erc721.address, nft_id);
  });

  it("should revert if creating a ERC721 token auction with a token owned by another address", async () => {
    const nft_id: number = constants.ERC721_TOKEN_SUPPLY - 1;

    await expect(test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NftError")
      .withArgs(test_ctx.mock_erc721.address, nft_id);
  });

  it("should revert if creating a ERC1155 token auction with an invalid ID", async () => {
    const nft_id: number = constants.ERC1155_TOKEN_SUPPLY;

    await expect(test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      nft_id,
      1,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NftError")
      .withArgs(test_ctx.mock_erc1155.address, nft_id);
  });

  it("should revert if creating a ERC721 token auction with an invalid amount", async () => {
    await expect(test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      1,
      0,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "AmountError");
  
    await expect(test_ctx.auction.createERC721Auction(
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      1,
      1,
      0,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "AmountError");
  });

  it("should revert if creating a ERC1155 token auction with an invalid amount", async () => {
    await expect(test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      0,
      0,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "AmountError");

    await expect(test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      0,
      constants.ERC1155_TOKEN_AMOUNT + 1,
      test_ctx.mock_erc20.address,
      1,
      1,
      1,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "NftError")
      .withArgs(test_ctx.mock_erc1155.address, 0);

    await expect(test_ctx.auction.createERC1155Auction(
        test_ctx.mock_erc1155.address,
        0,
        1,
        test_ctx.mock_erc20.address,
        1,
        0,
        1,
        0
      ))
        .to.be.revertedWithCustomError(test_ctx.auction, "AmountError");
  
    await expect(test_ctx.auction.createERC1155Auction(
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      1,
      1,
      0,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.auction, "AmountError");
  });
});
