# Lit Protocol x Chakra Drive

## Setting up

### Generating a new wallet

Run `ts-node -P scripts/tsconfig-scripts.json scripts/generate_wallet.ts` to generate a new wallet. Make sure to save the private key as `LIT_PRIVATE_KEY` in `.env`.

### Requesting tstLPX (Lit's test native token)

Please head over to https://chronicle-yellowstone-faucet.getlit.dev/ and paste the public key for the wallet generated above.

### Minting a new Capacity Credit Token

Adjust the params as needed in `scripts/create_lit_wallet.ts` and run `ts-node -P scripts/tsconfig-scripts.json scripts/create_lit_wallet.ts` to mint a new Capacity Credit Token. Make sure to save the capacity credit token id as `LIT_CAPACITY_CREDIT_TOKEN_ID` in `.env`.

## Client/Server Flow

![Lit Protocol Flow](https://github.com/user-attachments/assets/2ab9978c-5b06-4039-aeed-750bd30d8017)

**NOTE:** One thing to note about encrypting with ed25519 keys is that a random nonce must be generated everytime when encrypting – it's okay that it's public but, and included in the encrypted data, but it must be different everytime.

### Lit Actions

Note that in the above diagram, lit actions are performed on the lit nodes. We have lit actions defined in `src/app/lib/litActionSiws.ts`. When this is ready to be used, run `npm run build:lit-action` to generate the Lit Action JS file. This file is then imported as raw code in the frontend to be used to send to Lit nodes. Once this is generated once, and files are encrypted with it as a condition, it cannot be changed. If so, the decryption on said files will fail.
