import { ethers } from 'ethers';

function generateEthereumWallet() {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();

  // Extract the private key and address
  const privateKey = wallet.privateKey;
  const address = wallet.address;

  return { privateKey, address };
}

function main() {
  const { privateKey, address } = generateEthereumWallet();

  console.log('New Ethereum Wallet:');
  console.log(`Private Key: ${privateKey}`);
  console.log(`Address: ${address}`);
}

main();
