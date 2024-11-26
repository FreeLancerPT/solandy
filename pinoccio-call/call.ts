import { Connection } from "@solana/web3.js";
import fs from "fs";

const connection = new Connection("https://api.devnet.solana.com");

const secret = JSON.parse(
  fs.readFileSync("../devnet.json").toString()
) as number[];

const secretKey = Uint8Array.from(secret);

console.log(secretKey);
