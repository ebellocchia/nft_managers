import { expect } from "chai";
import { Contract } from "ethers";
// Project
import * as constants from "../common/Constants";
import { Sale, SellerTestContext, initSellerTestContextAndCreate } from "./UtilsSeller";


async function testRemove(
  seller: Contract,
  mock_token: Contract
) : Promise<void> {
  const nft_id: number = 0;
  const sale_data_before: Sale = await seller.Sales(mock_token.address, nft_id);

  await expect(await seller.removeSale(
    mock_token.address,
    nft_id
  ))
    .to.emit(seller, "SaleRemoved")
    .withArgs(
      mock_token.address,
      nft_id
    );

  const sale_data_after: Sale = await seller.Sales(mock_token.address, nft_id);
  expect(sale_data_after.nftAmount).to.equal(sale_data_after.nftAmount);
  expect(sale_data_after.erc20Contract).to.equal(sale_data_before.erc20Contract);
  expect(sale_data_after.erc20Amount).to.equal(sale_data_before.erc20Amount);
  expect(sale_data_after.isActive).to.equal(false);
}

async function testRemoveNotCreated(
  seller: Contract,
  mock_token: Contract
) : Promise<void> {
  const nft_id: number = 1;

  await expect(seller.removeSale(
    mock_token.address,
    nft_id
  ))
    .to.be.revertedWithCustomError(seller, "SaleNotCreatedError")
    .withArgs(
      mock_token.address,
      nft_id
    );
}

describe("NftsSeller.Remove", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContextAndCreate();
  });

  it("should remove a token to be sold", async () => {
    await testRemove(
      test_ctx.seller,
      test_ctx.mock_erc721
    );
    await testRemove(
      test_ctx.seller,
      test_ctx.mock_erc1155
    );
  });

  it("should revert if removing a token sale that is not created", async () => {
    await testRemoveNotCreated(
      test_ctx.seller,
      test_ctx.mock_erc721
    );
    await testRemoveNotCreated(
      test_ctx.seller,
      test_ctx.mock_erc1155
    );
  });

  it("should revert if removing a token sale with null addresses", async () => {
    await expect(test_ctx.seller.removeSale(constants.NULL_ADDRESS, 0))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");
  });
});
