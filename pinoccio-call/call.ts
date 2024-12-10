import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  Transaction,
  sendAndConfirmTransaction,
  VersionedTransaction,
} from "@solana/web3.js";
import fs from "fs";

// Establish a connection to Solana devnet
const connection = new Connection(
  "https://rough-fragrant-snowflake.solana-devnet.quiknode.pro/8ad5a507040bc10837f3093024bc6e5d1125b729/",
  { commitment: "confirmed" }
);

// Load the payer keypair from a local file
const secret = JSON.parse(
  fs.readFileSync("../devnet.json").toString()
) as number[];
const secretKey = Uint8Array.from(secret);
const payer = Keypair.fromSecretKey(secretKey);

// Your deployed program's public key
const PROGRAM_ID = new PublicKey(
  "F2cA3ogmFfbHmpm2fnWTDiWiXxNJMZKwJJj26fFxfbeC"
);
const fakeSigner = new PublicKey(
  "Andy1111111111111111111111111111111111111111"
); // Fake signer public key

async function initializeAccount() {
  const account = new Keypair();
  console.log("New account public key:", account.publicKey.toBase58());

  // Create a system account and set its owner to your program
  const createAccountInstruction = SystemProgram.createAccount({
    space: 89,
    lamports: await connection.getMinimumBalanceForRentExemption(89),
    fromPubkey: payer.publicKey,
    newAccountPubkey: account.publicKey,
    programId: PROGRAM_ID,
  });

  // Send the transaction to create the account
  const blockHash = (await connection.getLatestBlockhash()).blockhash;
  const transaction = new Transaction().add(createAccountInstruction);
  transaction.recentBlockhash = blockHash;
  transaction.sign(payer, account);

  const txid = await sendAndConfirmTransaction(connection, transaction, [
    payer,
    account,
  ]);
  console.log("Account creation transaction ID:", txid);

  // Ensure the account is funded for testing
  //await connection.requestAirdrop(account.publicKey, 1_000_000_000); // 1 SOL
  //console.log("Airdrop completed for account:", account.publicKey.toBase58());

  // Initialize the account via the program
  await sendRating(account);
  return account;
}
async function sendRating(account: any) {
  // Prepare the instruction data for the program
  const instructionData = Buffer.alloc(8); // Allocate 8 bytes for the u64
  instructionData.writeBigUInt64LE(BigInt(10), 0); // Replace `5` with your intended value

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: account.publicKey, isSigner: false, isWritable: true }, // Program account
      { pubkey: fakeSigner, isSigner: false, isWritable: true }, // Fake signer
      { pubkey: payer.publicKey, isSigner: true, isWritable: false }, // Payer
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System program
    ],
    data: instructionData,
  });

  const blockHash = (await connection.getLatestBlockhash()).blockhash;
  const transaction = new Transaction().add(ix);
  transaction.recentBlockhash = blockHash;
  transaction.sign(payer);

  const txid = await sendAndConfirmTransaction(connection, transaction, [
    payer,
  ]);
  console.log("Rating transaction ID:", txid);
}

async function main() {
  try {
    // Step 1: Initialize a new account and set it up for the program
    const programAccount = await initializeAccount();

    // Step 2: Send a rating transaction (example: rating value = 5)
    const ratingValue = 5;
    console.log("Sending rating:", ratingValue);
    await sendRating(programAccount);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the main function
main();
