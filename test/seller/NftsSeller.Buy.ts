import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
// Project
import * as constants from "../common/Constants";
import { getMockERC20TokenContractAt } from "../common/UtilsCommon";
import { Sale, SellerTestContext, initSellerTestContextAndCreate } from "./UtilsSeller";


describe("NftsSeller.Buy", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContextAndCreate();
  });

  it("should allow a user to buy a created ERC721 token", async () => {
    const nft_id: number = 0;
    const owner_address: string = await test_ctx.accounts.owner.getAddress();
    const initial_owner_balance: BigNumber = await test_ctx.mock_erc20.balanceOf(owner_address);
    const initial_user_balance: BigNumber = await test_ctx.mock_erc20.balanceOf(test_ctx.user_1_address);
    const sale_data_before: Sale = await test_ctx.seller.Sales(test_ctx.mock_erc721.address, nft_id);

    await expect(await test_ctx.seller.connect(test_ctx.user_1_account).buyERC721(
      test_ctx.mock_erc721.address,
      nft_id
    ))
      .to.emit(test_ctx.seller, "SaleCompleted")
      .withArgs(
        test_ctx.user_1_address,
        test_ctx.mock_erc721.address,
        nft_id,
        0,
        sale_data_before.erc20Contract,
        sale_data_before.erc20Amount
      );

    // Check data
    const sale_data_after: Sale = await test_ctx.seller.Sales(test_ctx.mock_erc721.address, nft_id);
    expect(sale_data_after.nftAmount).to.equal(sale_data_before.nftAmount);
    expect(sale_data_after.erc20Contract).to.equal(sale_data_before.erc20Contract);
    expect(sale_data_after.erc20Amount).to.equal(sale_data_before.erc20Amount);
    expect(sale_data_after.isActive).to.equal(false);

    expect(await test_ctx.seller.isSaleActive(test_ctx.mock_erc721.address, nft_id))
      .to.equal(false);

    // Check token transfers
    const mock_erc20: Contract = await getMockERC20TokenContractAt(sale_data_before.erc20Contract);

    expect(await mock_erc20.balanceOf(owner_address))
      .to.equal(initial_owner_balance.add(sale_data_before.erc20Amount));
    expect(await mock_erc20.balanceOf(test_ctx.user_1_address))
      .to.equal(initial_user_balance.sub(sale_data_before.erc20Amount));
    expect(await test_ctx.mock_erc721.ownerOf(nft_id))
      .to.equal(test_ctx.user_1_address);
  });

  it("should allow a user to buy a created ERC1155 token", async () => {
    const nft_amount_bought: number = constants.ERC1155_TOKEN_AMOUNT - 2;
    const nft_id: number = 0;
    const owner_address: string = await test_ctx.accounts.owner.getAddress();
    const initial_owner_balance: BigNumber = await test_ctx.mock_erc20.balanceOf(owner_address);
    const initial_user_balance: BigNumber = await test_ctx.mock_erc20.balanceOf(test_ctx.user_1_address);
    const sale_data_before: Sale = await test_ctx.seller.Sales(test_ctx.mock_erc1155.address, nft_id);

    await expect(await test_ctx.seller.connect(test_ctx.user_1_account).buyERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      nft_amount_bought
    ))
      .to.emit(test_ctx.seller, "SaleCompleted")
      .withArgs(
        test_ctx.user_1_address,
        test_ctx.mock_erc1155.address,
        nft_id,
        nft_amount_bought,
        sale_data_before.erc20Contract,
        sale_data_before.erc20Amount
      );

    const token_price_1: BigNumber = sale_data_before.erc20Amount.mul(nft_amount_bought);
    const mock_erc20: Contract = await getMockERC20TokenContractAt(sale_data_before.erc20Contract);

    // Check data, sale is still active because the bought token amount is less than the sold one
    const sale_data_after_1: Sale = await test_ctx.seller.Sales(test_ctx.mock_erc1155.address, nft_id);
    expect(sale_data_after_1.nftAmount).to.equal(sale_data_before.nftAmount.sub(nft_amount_bought));
    expect(sale_data_after_1.erc20Contract).to.equal(sale_data_before.erc20Contract);
    expect(sale_data_after_1.erc20Amount).to.equal(sale_data_before.erc20Amount);
    expect(sale_data_after_1.isActive).to.equal(true);

    expect(await test_ctx.seller.isSaleActive(test_ctx.mock_erc1155.address, nft_id))
      .to.equal(true);
  
    // Check token transfers
    expect(await mock_erc20.balanceOf(owner_address))
      .to.equal(initial_owner_balance.add(token_price_1));
    expect(await mock_erc20.balanceOf(test_ctx.user_1_address))
      .to.equal(initial_user_balance.sub(token_price_1));
    expect(await test_ctx.mock_erc1155.balanceOf(test_ctx.user_1_address, nft_id))
      .to.equal(nft_amount_bought);

    // Buy again the remaining amount to reset the sale
    const nft_amount_remaining: number = constants.ERC1155_TOKEN_AMOUNT - nft_amount_bought;
    const token_price_2: BigNumber = sale_data_after_1.erc20Amount.mul(nft_amount_remaining);
  
    await test_ctx.seller.connect(test_ctx.user_1_account).buyERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      nft_amount_remaining
    );

    // Check data, sale is now inactive because the total token amount was bought
    const sale_data_after_2: Sale = await test_ctx.seller.Sales(test_ctx.mock_erc1155.address, nft_id);
    expect(sale_data_after_2.nftAmount).to.equal(0);
    expect(sale_data_after_2.erc20Contract).to.equal(sale_data_before.erc20Contract);
    expect(sale_data_after_2.erc20Amount).to.equal(sale_data_before.erc20Amount);
    expect(sale_data_after_2.isActive).to.equal(false);

    expect(await test_ctx.seller.isSaleActive(test_ctx.mock_erc1155.address, nft_id))
      .to.equal(false);

    // Check token transfers
    expect(await mock_erc20.balanceOf(owner_address))
      .to.equal(initial_owner_balance.add(token_price_1).add(token_price_2));
    expect(await mock_erc20.balanceOf(test_ctx.user_1_address))
      .to.equal(initial_user_balance.sub(token_price_1).sub(token_price_2));
    expect(await test_ctx.mock_erc1155.balanceOf(test_ctx.user_1_address, nft_id))
      .to.equal(nft_amount_bought + nft_amount_remaining);
  });

  it("should revert if buying a token with not enough balance", async () => {
    await expect(test_ctx.seller.connect(test_ctx.user_3_account).buyERC721(
      test_ctx.mock_erc721.address,
      0
    ))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance");

    await expect(test_ctx.seller.connect(test_ctx.user_3_account).buyERC1155(
        test_ctx.mock_erc1155.address,
        0,
        1
      ))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should revert if buying a ERC1155 token with invalid amount", async () => {
    const nft_id: number = 0;
    const sale_data: Sale = await test_ctx.seller.Sales(test_ctx.mock_erc1155.address, nft_id);

    await expect(test_ctx.seller.connect(test_ctx.user_1_account).buyERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      sale_data.nftAmount.add(1)
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "AmountError");
  });

  it("should revert if buying a token with null address", async () => {
    const nft_id: number = 0;

    await expect(test_ctx.seller.connect(test_ctx.user_1_account).buyERC721(
      constants.NULL_ADDRESS,
      nft_id
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");

    await expect(test_ctx.seller.connect(test_ctx.user_1_account).buyERC1155(
      constants.NULL_ADDRESS,
      nft_id,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "NullAddressError");
  });

  it("should revert if buying a token whose sale that is not created ", async () => {
    const nft_id: number = 1;

    await expect(test_ctx.seller.connect(test_ctx.user_1_account).buyERC721(
      test_ctx.mock_erc721.address,
      nft_id
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "SaleNotCreatedError")
      .withArgs(
        test_ctx.mock_erc721.address,
        nft_id
      );

    await expect(test_ctx.seller.connect(test_ctx.user_1_account).buyERC1155(
      test_ctx.mock_erc1155.address,
      nft_id,
      1
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "SaleNotCreatedError")
      .withArgs(
        test_ctx.mock_erc1155.address,
        nft_id
      );
  });
});
