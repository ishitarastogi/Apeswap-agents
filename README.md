
# GNANA Token Large Balance Agent

## Description

This agent detects accounts with large amount of `GNANA` balance.

## Supported Chains

- Binance

## Alerts


- APESWAP-4
  - Fired when balance of the destination account of a transfer is more than threshold percentage of the total supply 
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata includes:
    * `account`: The account that is receiving the tokens
    * `balance`: Balance of the account


