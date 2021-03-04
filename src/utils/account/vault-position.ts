import { BigInt, log, Result } from "@graphprotocol/graph-ts";
import { Account, AccountVaultPosition, AccountVaultPositionUpdate, Transaction, Vault } from "../../../generated/schema";
import * as vaultPositionUpdateLibrary from './vault-position-update'

export function buildId(
  account: Account,
  vault: Vault
): string {
  return account.id.concat('-').concat(vault.id)
}

export class VaultPositionResponse {
  public accountVaultPosition: AccountVaultPosition
  public accountVaultPositionUpdate: AccountVaultPositionUpdate
  constructor(
    accountVaultPosition: AccountVaultPosition,
    accountVaultPositionUpdate: AccountVaultPositionUpdate
  ) {
    this.accountVaultPosition = accountVaultPosition
    this.accountVaultPositionUpdate = accountVaultPositionUpdate
  }
  static fromValue(
    accountVaultPosition: AccountVaultPosition,
    accountVaultPositionUpdate: AccountVaultPositionUpdate
  ): VaultPositionResponse {
    return new VaultPositionResponse(
      accountVaultPosition,
      accountVaultPositionUpdate
    )
  }
}

export function deposit(
  account: Account,
  vault: Vault,
  transactionHash: string,
  transactionIndex: string,
  depositedTokens: BigInt,
  receivedShares: BigInt
): VaultPositionResponse{
  let vaultPositionId = buildId(account, vault)
  let accountVaultPosition = AccountVaultPosition.load(vaultPositionId)

  if (accountVaultPosition == null) {
    accountVaultPosition = new AccountVaultPosition(vaultPositionId)
    accountVaultPosition.vault = vault.id
    accountVaultPosition.account = account.id
    accountVaultPosition.transaction = transactionHash
    accountVaultPosition.balanceTokens = depositedTokens
    accountVaultPosition.balanceShares = receivedShares
    vaultPositionUpdateLibrary.createFirst(
      accountVaultPosition!,
      transactionHash,
      transactionIndex,
      depositedTokens,
      receivedShares
    )
  } else {
    accountVaultPosition.balanceTokens = accountVaultPosition.balanceTokens.plus(depositedTokens)
    accountVaultPosition.balanceShares = accountVaultPosition.balanceShares.plus(receivedShares)
    vaultPositionUpdateLibrary.deposit(
      accountVaultPosition!,
      transactionHash,
      transactionIndex,
      depositedTokens,
      receivedShares
    )
  }

  log.error('prev v2', [])
  // log.error('1 vault position update id {}', [accountVaultPositionUpdate.id])
  log.error('2 vault position update id {}', [vaultPositionUpdateLibrary.buildIdFromAccountHashAndIndex(
    account.id,
    transactionHash,
    transactionIndex
  )])
  log.error('post', [])
  accountVaultPosition.latestUpdate = vaultPositionUpdateLibrary.buildIdFromAccountHashAndIndex(
    account.id,
    transactionHash,
    transactionIndex
  )
  log.error('post2', [])
  accountVaultPosition.save()

  return VaultPositionResponse.fromValue(
    accountVaultPosition!,
    null
    // accountVaultPositionUpdate!
  )
}


export function withdraw(
  account: Account,
  vault: Vault,
  transactionHash: string,
  transactionIndex: string,
  burntShares: BigInt,
  receivedTokens: BigInt
): VaultPositionResponse {
  let id = buildId(account, vault)
  let accountVaultPosition = AccountVaultPosition.load(id)

  accountVaultPosition.balanceShares = accountVaultPosition.balanceShares.minus(burntShares)
  accountVaultPosition.balanceTokens = accountVaultPosition.balanceTokens.minus(receivedTokens)

  // let accountVaultPositionUpdate = vaulPositionUpdate.getOrCreate()
  // accountVaultPosition.latestUpdate = accountVaultPositionUpdate.id
  // accountVaultPosition.updates.push(accountVaultPositionUpdate.id)

  accountVaultPosition.save()

  return VaultPositionResponse.fromValue(
    accountVaultPosition!,
    null
  )
}
