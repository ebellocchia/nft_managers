import { expect } from "chai";
import { Contract } from "ethers";
// Project
import * as constants from "../common/Constants";
import { Sale, SellerTestContext, initSellerTestContextAndToken } from "./UtilsSeller";


async function testCreate(
  seller: Contract,
  mock_nft: Contract,
  mock_erc20: Contract
) : Promise<void> {
  const is_erc721: boolean = await mock_nft.supportsInterface(constants.ERC721_INTERFACE_ID);
  const erc20_amount: number = 1;
  const nft_amount: number = is_erc721 ? 0 : constants.ERC1155_TOKEN_AMOUNT;
  const nft_id: number = 0;

  if (is_erc721) {
    await expect(await seller.createERC721Sale(
      mock_nft.address,
      nft_id,
      mock_erc20.address,
      erc20_amount
    ))
      .to.emit(seller, "SaleCreated")
      .withArgs(
        mock_nft.address,
        nft_id,
        nft_amount,
        mock_erc20.address,
        erc20_amount
      );
  }
  else {
    await expect(await seller.createERC1155Sale(
      mock_nft.address,
      nft_id,
      nft_amount,
      mock_erc20.address,
      erc20_amount
    ))
      .to.emit(seller, "SaleCreated")
      .withArgs(
        mock_nft.address,
        nft_id,
        nft_amount,
        mock_erc20.address,
        erc20_amount
      );

  }

  const sale_data: Sale = await seller.Sales(mock_nft.address, nft_id);
  expect(sale_data.nftAmount).to.equal(nft_amount);
  expect(sale_data.erc20Contract).to.equal(mock_erc20.address);
  expect(sale_data.erc20Amount).to.equal(erc20_amount);
  expect(sale_data.isActive).to.equal(true);

  expect(await seller.isSaleActive(mock_nft.address, nft_id))
    .to.equal(true);
}

describe("NftsSeller.Create", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContextAndToken();
  });

  it("should create a token sale", async () => {
    await testCreate(
      test_ctx.seller,
      test_ctx.mock_erc721,
      test_ctx.mock_erc20
    );
    await testCreate(
      test_ctx.seller,
      test_ctx.mock_erc1155,
      test_ctx.mock_erc20
    );
  });

  it("should revert if creating a ERC721 token sale with null addresses", async () => {
    await expect(test_ctx.seller.createERC721Sale(
      constants.NULL_ADDRESS,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");

    await expect(test_ctx.seller.createERC721Sale(
      test_ctx.mock_erc721.address,
      0,
      constants.NULL_ADDRESS,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");
  });

  it("should revert if creating a ERC1155 token sale with null addresses", async () => {
    await expect(test_ctx.seller.createERC1155Sale(
      constants.NULL_ADDRESS,
      0,
      1,
      test_ctx.mock_erc20.address,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");

    await expect(test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      0,
      1,
      constants.NULL_ADDRESS,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");
  });

  it("should revert if creating a ERC721 token sale that is already existent", async () => {
    await test_ctx.seller.createERC721Sale(
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    );
    await expect(test_ctx.seller.createERC721Sale(
      test_ctx.mock_erc721.address,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "SaleAlreadyCreatedError")
      .withArgs(test_ctx.mock_erc721.address, 0);
  });

  it("should revert if creating a ERC1155 token sale that is already existent", async () => {
    await test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    );
    await expect(test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      0,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "SaleAlreadyCreatedError")
      .withArgs(test_ctx.mock_erc1155.address, 0);
  });

  it("should revert if creating a ERC721 token sale with an invalid ID", async () => {
    const nft_id: number = constants.ERC721_TOKEN_SUPPLY;

    await expect(test_ctx.seller.createERC721Sale(
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NftError")
      .withArgs(test_ctx.mock_erc721.address, nft_id);
  });

  it("should revert if creating a ERC721 token sale with a token owned by another address", async () => {
    const nft_id: number = constants.ERC721_TOKEN_SUPPLY - 1;

    await expect(test_ctx.seller.createERC721Sale(
      test_ctx.mock_erc721.address,
      nft_id,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NftError")
      .withArgs(test_ctx.mock_erc721.address, nft_id);
  });

  it("should revert if creating a ERC1155 token sale with an invalid ID", async () => {
    const nft_id: number = constants.ERC1155_TOKEN_SUPPLY;

    await expect(test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      nft_id,
      1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NftError")
      .withArgs(test_ctx.mock_erc1155.address, nft_id);
  });

  it("should revert if creating a ERC1155 token sale with an invalid amount", async () => {
    await expect(test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      0,
      0,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "AmountError");

    await expect(test_ctx.seller.createERC1155Sale(
      test_ctx.mock_erc1155.address,
      0,
      constants.ERC1155_TOKEN_AMOUNT + 1,
      test_ctx.mock_erc20.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NftError")
      .withArgs(test_ctx.mock_erc1155.address, 0);
  });
});
