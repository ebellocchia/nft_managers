import { expect } from "chai";
import { Contract } from "ethers";
// Project
import * as constants from "../common/Constants";
import { Redeem, RedeemerTestContext, initRedeemerTestContextAndToken } from "./UtilsRedeemer";


async function testCreate(
  redeemer: Contract,
  mock_nft: Contract,
  mock_erc20: Contract,
  user_address: string
) : Promise<void> {
  const is_erc721: boolean = await mock_nft.supportsInterface(constants.ERC721_INTERFACE_ID);
  const erc20_amount: number = 1;
  const nft_amount: number = is_erc721 ? 0 : 1;
  const nft_id: number = 0;

  if (is_erc721) {
    await expect(await redeemer.createERC721Redeem(
      user_address,
      mock_nft.address,
      nft_id,
      mock_erc20.address,
      erc20_amount
    ))
      .to.emit(redeemer, "RedeemCreated")
      .withArgs(
        user_address,
        mock_nft.address,
        nft_id,
        0,
        mock_erc20.address,
        erc20_amount
      );
  }
  else {
    await expect(await redeemer.createERC1155Redeem(
      user_address,
      mock_nft.address,
      nft_id,
      nft_amount,
      mock_erc20.address,
      erc20_amount
    ))
      .to.emit(redeemer, "RedeemCreated")
      .withArgs(
        user_address,
        mock_nft.address,
        nft_id,
        nft_amount,
        mock_erc20.address,
        erc20_amount
      );
  }

  expect(await redeemer.Redeemers(mock_nft.address, nft_id))
    .to.equal(user_address);

  const redeem_data: Redeem = await redeemer.Redeems(user_address);
  expect(redeem_data.nftContract).to.equal(mock_nft.address);
  expect(redeem_data.nftId).to.equal(nft_id);
  expect(redeem_data.nftAmount).to.equal(nft_amount);
  expect(redeem_data.erc20Contract).to.equal(mock_erc20.address);
  expect(redeem_data.erc20Amount).to.equal(erc20_amount);
  expect(redeem_data.isActive).to.equal(true);

  expect(await redeemer["isRedeemActive(address)"](user_address))
    .to.equal(true);
  expect(await redeemer["isRedeemActive(address,uint256)"](redeem_data.nftContract, redeem_data.nftId))
    .to.equal(true);
}

describe("NftsRedeemer.Create", () => {
  let test_ctx: RedeemerTestContext;

  beforeEach(async () => {
    test_ctx = await initRedeemerTestContextAndToken();
  });

  it("should create a token to be redeemed", async () => {
    await testCreate(
      test_ctx.redeemer,
      test_ctx.mock_erc721,
      test_ctx.mock_erc20,
      test_ctx.user_1_address
    );
  });

  it("should create a ERC1155 token to be redeemed", async () => {
    await testCreate(
      test_ctx.redeemer,
      test_ctx.mock_erc1155,
      test_ctx.mock_erc20,
      test_ctx.user_1_address
    );
  });

  it("should revert if creating a ERC721 token redeem with null addresses", async () => {
    await expect(test_ctx.redeemer.createERC721Redeem(
      constants.NULL_ADDRESS,
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");

    await expect(test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      constants.NULL_ADDRESS,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");

    await expect(test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc721.address,
      0,
      constants.NULL_ADDRESS,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");
  });

  it("should revert if creating a ERC1155 token redeem with null addresses", async () => {
    await expect(test_ctx.redeemer.createERC1155Redeem(
      constants.NULL_ADDRESS,
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");

    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      constants.NULL_ADDRESS,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");

    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      0,
      1,
      constants.NULL_ADDRESS,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NullAddressError");
  });

  it("should revert if creating a ERC721 token redeem more than once for the same user", async () => {
    await test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    );
    await expect(test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "RedeemAlreadyCreatedError")
      .withArgs(test_ctx.user_1_address);
  });

  it("should revert if creating a ERC1155 token redeem more than once for the same user", async () => {
    await test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    );
    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "RedeemAlreadyCreatedError")
      .withArgs(test_ctx.user_1_address);
  });

  it("should revert if creating a ERC721 token redeem that is already created for another user", async () => {
    await test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_2_address,
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    );
    await expect(test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "RedeemAlreadyCreatedError")
      .withArgs(test_ctx.user_2_address);
  });

  it("should revert if creating a ERC1155 token redeem that is already created for another user", async () => {
    await test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_2_address,
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    );
    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "RedeemAlreadyCreatedError")
      .withArgs(test_ctx.user_2_address);
  });

  it("should revert if creating a ERC721 token redeem with an invalid ID", async () => {
    const nft_id: number = constants.ERC721_TOKEN_SUPPLY;

    await expect(test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NftError")
      .withArgs(test_ctx.mock_erc721.address, nft_id);
  });

  it("should revert if creating a ERC721 token redeem with a token owned by another address", async () => {
    const nft_id: number = constants.ERC721_TOKEN_SUPPLY - 1;

    await expect(test_ctx.redeemer.createERC721Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NftError")
      .withArgs(test_ctx.mock_erc721.address, nft_id);
  });

  it("should revert if creating a ERC1155 token redeem with an invalid ID", async () => {
    const nft_id: number = constants.ERC1155_TOKEN_SUPPLY;

    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      nft_id,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NftError")
      .withArgs(test_ctx.mock_erc1155.address, nft_id);
  });

  it("should revert if creating a ERC1155 token redeem with an invalid amount", async () => {
    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      0,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "AmountError");

    await expect(test_ctx.redeemer.createERC1155Redeem(
      test_ctx.user_1_address,
      test_ctx.mock_erc1155.address,
      0,
      constants.ERC1155_TOKEN_AMOUNT + 1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.redeemer, "NftError")
      .withArgs(test_ctx.mock_erc1155.address, 0);
  });
});
