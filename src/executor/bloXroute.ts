import {
    createTraderAPIMemoInstruction,
    HttpProvider,
    MAINNET_API_UK_HTTP,
    MAINNET_API_NY_HTTP,
  } from "@bloxroute/solana-trader-client-ts";
  import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    Keypair,
    SystemProgram,
  } from "@solana/web3.js";
  import base58 from "bs58";
  import { Transaction } from "@solana/web3.js";
import { BLOXROUTE_AUTH_HEADER, BLOXROUTE_FEE, PRIVATE_KEY } from "../constants";
  const TRADER_API_TIP_WALLET = "HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY";
  const provider = new HttpProvider(
    BLOXROUTE_AUTH_HEADER,
    PRIVATE_KEY,
    MAINNET_API_NY_HTTP // or MAINNET_API_NY_HTTP
  );
  export async function CreateTraderAPITipTransaction(
    senderAddress: PublicKey,
    tipAmountInLamports: number
  ): Promise<Transaction> {
    const tipAddress = new PublicKey(TRADER_API_TIP_WALLET);
    return new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderAddress,
        toPubkey: tipAddress,
        lamports: tipAmountInLamports,
      })
    );
  }

  export async function bloXroute_executeAndConfirm(
    tx: Transaction,
    wallet: Keypair
  ): Promise<string | false> {
    try {
      const fee = BLOXROUTE_FEE;
      const tipTransaction = await CreateTraderAPITipTransaction(
        wallet.publicKey,
        fee * LAMPORTS_PER_SOL
      );
      tx.add(tipTransaction);
      tx.sign(wallet);
      
      const serializeTxBytes = tx.serialize();
      const buffTx = Buffer.from(serializeTxBytes);
      const encodedTx = buffTx.toString("base64");
    
      const request = {
        transaction: { content: encodedTx, isCleanup: false },
        frontRunningProtection: false,
        useStakedRPCs: true, // Send directly to current block leader for faster execution
      };
      
      const response = await provider.postSubmit(request);
    
      if (response?.signature) {
        return response.signature.toString();
      } else {
        console.error("BloxRoute transaction failed: No signature in response");
        return false;
      }
    } catch (error) {
      console.error("Error executing BloxRoute transaction:", error);
      return false;
    }
  }