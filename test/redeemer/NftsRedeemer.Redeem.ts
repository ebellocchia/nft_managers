import { expect } from "chai";
import { BigNumber, Contract, Signer } from "ethers";
// Project
import * as constants from "../common/Constants";
import {
  getMockERC20TokenContractAt, getMockERC721TokenContractAt, getMockERC1155TokenContractAt
} from "../common/UtilsCommon";
import { Redeem, RedeemerTestContext, initRedeemerTestContextAndCreate } from "./UtilsRedeemer";


async function testRedeemToken(
  redeemer: Contract,
  mock_nft: Contract,
  owner: Signer,
  user_account: Signer
) : Promise<void> {
  const is_erc721: boolean = await mock_nft.supportsInterface(constants.ERC721_INTERFACE_ID);
  const user_address: string = await user_account.getAddress();
  const redeem_data_before: Redeem = await redeemer.Redeems(user_address);
  const mock_erc20: Contract = await getMockERC20TokenContractAt(redeem_data_before.erc20Contract);
  
  const owner_address: string = await owner.getAddress();
  const initial_owner_balance: BigNumber = await mock_erc20.balanceOf(owner_address);
  const initial_user_balance: BigNumber = await mock_erc20.balanceOf(user_address);

  await expect(redeemer.connect(user_account).redeemToken())
    .to.emit(redeemer, "RedeemCompleted")
    .withArgs(
      user_address,
      redeem_data_before.nftContract,
      redeem_data_before.nftId,
      redeem_data_before.nftAmount,
      redeem_data_before.erc20Contract,
      redeem_data_before.erc20Amount
    );

  expect(await redeemer.Redeemers(redeem_data_before.nftContract, redeem_data_before.nftId))
    .to.equal(constants.NULL_ADDRESS);

  // Check data
  const redeem_data_after = await redeemer.Redeems(user_address);
  expect(redeem_data_after.nftContract).to.equal(redeem_data_before.nftContract);
  expect(redeem_data_after.nftId).to.equal(redeem_data_before.nftId);
  expect(redeem_data_after.nftAmount).to.equal(redeem_data_before.nftAmount);
  expect(redeem_data_after.erc20Contract).to.equal(redeem_data_before.erc20Contract);
  expect(redeem_data_after.erc20Amount).to.equal(redeem_data_before.erc20Amount);
  expect(redeem_data_after.isActive).to.equal(false);

  expect(await redeemer["isRedeemActive(address)"](user_address))
    .to.equal(false);
  expect(await redeemer["isRedeemActive(address,uint256)"](redeem_data_after.nftContract, redeem_data_after.nftId))
    .to.equal(false);

  // Check token transfers
  expect(await mock_erc20.balanceOf(owner_address))
    .to.equal(initial_owner_balance.add(redeem_data_after.erc20Amount));
  expect(await mock_erc20.balanceOf(user_address))
    .to.equal(initial_user_balance.sub(redeem_data_after.erc20Amount));

  if (is_erc721) {
    const mock_erc721: Contract = await getMockERC721TokenContractAt(redeem_data_after.nftContract);
    expect(await mock_erc721.ownerOf(redeem_data_after.nftId))
      .to.equal(user_address);
  }
  else {
    const mock_erc1155: Contract = await getMockERC1155TokenContractAt(redeem_data_after.nftContract);
    expect(await mock_erc1155.balanceOf(user_address, redeem_data_after.nftId))
      .to.equal(redeem_data_after.nftAmount);
  }
}

async function testNotEnoughBalance(
  redeemer: Contract,
  mock_nft: Contract,
  mock_erc20: Contract,
  user_account: Signer,
) : Promise<void> {
  const is_erc721: boolean = await mock_nft.supportsInterface(constants.ERC721_INTERFACE_ID);
  const user_address: string = await user_account.getAddress();

  if (is_erc721) {
    await redeemer.createERC721Redeem(
      user_address,
      mock_nft.address,
      2,
      mock_erc20.address,
      constants.ERC20_TOKEN_SUPPLY
    );
  }
  else {
    await redeemer.createERC1155Redeem(
      user_address,
      mock_nft.address,
      1,
      1,
      mock_erc20.address,
      constants.ERC20_TOKEN_SUPPLY
    );
  }

  await expect(redeemer.connect(user_account).redeemToken())
    .to.be.revertedWith("ERC20: transfer amount exceeds balance");
}

describe("NftsRedeemer.Redeem", () => {
  let test_ctx: RedeemerTestContext;

  beforeEach(async () => {
    test_ctx = await initRedeemerTestContextAndCreate();
  });

  it("should allow a user to redeem a token", async () => {
    await testRedeemToken(
      test_ctx.redeemer,
      test_ctx.mock_erc721,
      test_ctx.accounts.owner,
      test_ctx.user_1_account
    );
    await testRedeemToken(
      test_ctx.redeemer,
      test_ctx.mock_erc1155,
      test_ctx.accounts.owner,
      test_ctx.user_2_account
    );
  });

  it("should revert if redeeming a ERC721 token with not enough balance", async () => {
    await testNotEnoughBalance(
      test_ctx.redeemer,
      test_ctx.mock_erc721,
      test_ctx.mock_erc20,
      test_ctx.user_3_account
    );
  });

  it("should revert if redeeming a ERC1155 token with not enough balance", async () => {
    await testNotEnoughBalance(
      test_ctx.redeemer,
      test_ctx.mock_erc1155,
      test_ctx.mock_erc20,
      test_ctx.user_3_account
    );
  });

  it("should revert if redeeming a not created token", async () => {
    await expect(test_ctx.redeemer.connect(test_ctx.user_3_account).redeemToken())
      .to.be.revertedWithCustomError(test_ctx.redeemer, "RedeemNotCreatedError")
      .withArgs(test_ctx.user_3_address);
  });
});
