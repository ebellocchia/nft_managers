import { expect } from "chai";
import { Contract } from "ethers";
// Project
import * as constants from "./Constants";
import { TestContext } from "./UtilsCommon";


//
// Exported functions
//

export async function testERC721Withdraw(
  manager: Contract,
  test_ctx: TestContext
) : Promise<void> {
  const nft_id: number = 0;
  const owner_address: string = await test_ctx.accounts.owner.getAddress();

  await expect(await manager.withdrawERC721(
    test_ctx.mock_erc721.address,
    nft_id
  ))
    .to.emit(manager, "ERC721Withdrawn")
    .withArgs(
      owner_address,
      test_ctx.mock_erc721.address,
      nft_id
    );

  expect(await test_ctx.mock_erc721.ownerOf(nft_id))
    .to.equal(owner_address);
}

export async function testERC1155Withdraw(
  manager: Contract,
  test_ctx: TestContext
) : Promise<void> {
  const nft_id: number = 0;
  const nft_amount: number = 2;
  const owner_address: string = await test_ctx.accounts.owner.getAddress();

  await expect(await manager.withdrawERC1155(
    test_ctx.mock_erc1155.address,
    nft_id,
    nft_amount
  ))
    .to.emit(manager, "ERC1155Withdrawn")
    .withArgs(
      owner_address,
      test_ctx.mock_erc1155.address,
      nft_id,
      nft_amount
    );

  expect(await test_ctx.mock_erc1155.balanceOf(owner_address, nft_id))
    .to.equal(nft_amount);
}

export async function testERC721WithdrawNullAddress(
  manager: Contract
) : Promise<void> {
  await expect(manager.withdrawERC721(constants.NULL_ADDRESS, 0))
  .to.be.revertedWithCustomError(manager, "NullAddressError");
}

export async function testERC721WithdrawInvalidId(
  manager: Contract,
  test_ctx: TestContext
) : Promise<void> {
  await expect(manager.withdrawERC721(
    test_ctx.mock_erc721.address,
    constants.ERC721_TOKEN_SUPPLY
  ))
    .to.be.revertedWithCustomError(test_ctx.mock_erc721, "ERC721InsufficientApproval")
    .withArgs(manager.address, constants.ERC721_TOKEN_SUPPLY);
}

export async function testERC1155WithdrawNullAddress(
  manager: Contract
) : Promise<void> {
  await expect(manager.withdrawERC1155(constants.NULL_ADDRESS, 0, 1))
  .to.be.revertedWithCustomError(manager, "NullAddressError");
}

export async function testERC1155WithdrawInvalidId(
  manager: Contract,
  test_ctx: TestContext
) : Promise<void> {
  const nft_amount: number = 1;
  const nft_id: number = constants.ERC1155_TOKEN_SUPPLY;

  await expect(manager.withdrawERC1155(
    test_ctx.mock_erc1155.address,
    nft_id,
    nft_amount
  ))
    .to.be.revertedWithCustomError(test_ctx.mock_erc1155, "ERC1155InsufficientBalance")
    .withArgs(
      manager.address,
      await test_ctx.mock_erc1155.balanceOf(manager.address, nft_id),
      nft_amount,
      nft_id
    );
}

export async function testERC1155WithdrawInvalidAmount(
  manager: Contract,
  test_ctx: TestContext
) : Promise<void> {
  const nft_amount: number = constants.ERC1155_TOKEN_AMOUNT + 1;
  const nft_id: number = 0;

  await expect(manager.withdrawERC1155(test_ctx.mock_erc1155.address, 0, 0))
    .to.be.revertedWithCustomError(manager, "AmountError");

  await expect(manager.withdrawERC1155(
    test_ctx.mock_erc1155.address,
    nft_id,
    nft_amount
  ))
    .to.be.revertedWithCustomError(test_ctx.mock_erc1155, "ERC1155InsufficientBalance")
    .withArgs(
      manager.address,
      await test_ctx.mock_erc1155.balanceOf(manager.address, nft_id),
      nft_amount,
      nft_id
    );
}
