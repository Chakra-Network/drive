// esbuild-shims.js
globalThis.process = {
  env: {}
};

// https://deno.land/std@0.224.0/encoding/_util.ts
var encoder = new TextEncoder();

// https://deno.land/std@0.224.0/encoding/base58.ts
var mapBase58 = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "7": 6,
  "8": 7,
  "9": 8,
  A: 9,
  B: 10,
  C: 11,
  D: 12,
  E: 13,
  F: 14,
  G: 15,
  H: 16,
  J: 17,
  K: 18,
  L: 19,
  M: 20,
  N: 21,
  P: 22,
  Q: 23,
  R: 24,
  S: 25,
  T: 26,
  U: 27,
  V: 28,
  W: 29,
  X: 30,
  Y: 31,
  Z: 32,
  a: 33,
  b: 34,
  c: 35,
  d: 36,
  e: 37,
  f: 38,
  g: 39,
  h: 40,
  i: 41,
  j: 42,
  k: 43,
  m: 44,
  n: 45,
  o: 46,
  p: 47,
  q: 48,
  r: 49,
  s: 50,
  t: 51,
  u: 52,
  v: 53,
  w: 54,
  x: 55,
  y: 56,
  z: 57
};
var base58alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".split("");
function decodeBase58(b58) {
  const splitInput = b58.trim().split("");
  let length = 0;
  let ones = 0;
  let index = 0;
  while (splitInput[index] === "1") {
    ones++;
    index++;
  }
  const notZeroData = splitInput.slice(index);
  const size = Math.round(b58.length * 733 / 1e3 + 1);
  const output = [];
  notZeroData.forEach((char, idx) => {
    let carry = mapBase58[char];
    let i = 0;
    if (carry === void 0) {
      throw new Error(`Invalid base58 char at index ${idx} with value ${char}`);
    }
    for (let reverseIterator = size - 1; (carry > 0 || i < length) && reverseIterator !== -1; reverseIterator--, i++) {
      carry += 58 * (output[reverseIterator] || 0);
      output[reverseIterator] = Math.round(carry % 256);
      carry = Math.floor(carry / 256);
    }
    length = i;
  });
  const validOutput = output.filter((item) => item !== void 0);
  if (ones > 0) {
    const onesResult = Array.from({ length: ones }).fill(0, 0, ones);
    return new Uint8Array([...onesResult, ...validOutput]);
  }
  return new Uint8Array(validOutput);
}

// dist/litActionSiws_v2.ts
function getSiwsMessage(siwsInput) {
  let message = `${siwsInput.domain} wants you to sign in with your Solana account:
${siwsInput.address}`;
  if (siwsInput.statement) {
    message += `

${siwsInput.statement}`;
  }
  const fields = [];
  if (siwsInput.uri !== void 0)
    fields.push(`URI: ${siwsInput.uri}`);
  if (siwsInput.version !== void 0)
    fields.push(`Version: ${siwsInput.version}`);
  if (siwsInput.chainId !== void 0)
    fields.push(`Chain ID: ${siwsInput.chainId}`);
  if (siwsInput.nonce !== void 0)
    fields.push(`Nonce: ${siwsInput.nonce}`);
  if (siwsInput.issuedAt !== void 0)
    fields.push(`Issued At: ${siwsInput.issuedAt}`);
  if (siwsInput.expirationTime !== void 0)
    fields.push(`Expiration Time: ${siwsInput.expirationTime}`);
  if (siwsInput.notBefore !== void 0)
    fields.push(`Not Before: ${siwsInput.notBefore}`);
  if (siwsInput.requestId !== void 0)
    fields.push(`Request ID: ${siwsInput.requestId}`);
  if (siwsInput.resources !== void 0 && siwsInput.resources.length > 0) {
    fields.push("Resources:");
    for (const resource of siwsInput.resources) {
      fields.push(`- ${resource}`);
    }
  }
  if (fields.length > 0) {
    message += `

${fields.join("\n")}`;
  }
  return message;
}
async function verifySiwsSignature(message, signatureBase58, publicKeyBase58) {
  const messageBytes = new TextEncoder().encode(message);
  try {
    const signatureBytes = decodeBase58(signatureBase58);
    const publicKeyBytes = decodeBase58(publicKeyBase58);
    const publicKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      {
        name: "Ed25519",
        namedCurve: "Ed25519"
      },
      false,
      ["verify"]
    );
    const isValid = await crypto.subtle.verify("Ed25519", publicKey, signatureBytes, messageBytes);
    return isValid;
  } catch (error) {
    console.error("Error in verifySiwsSignature:", error);
    throw error;
  }
}
function bytesToHex(uint8arr) {
  if (!uint8arr)
    return "";
  return Array.from(uint8arr).map((byte) => `0${(byte & 255).toString(16)}`.slice(-2)).join("");
}
(async () => {
  try {
    const _siwsObject = JSON.parse(siwsObject);
    const { siwsInput } = _siwsObject;
    const { signature } = _siwsObject;
    const publicKeyBase58 = siwsInput.address;
    console.log("fetching nonces");
    const url = "https://drive.chakra.network/api/verify_hash?hash=" + siwsInput.nonce + "&public_key=" + publicKeyBase58;
    const resp = await fetch(url).then((response) => response.json());
    const isValidHash = resp.success;
    if (!isValidHash) {
      console.log("SIWS message has not correct nonce");
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: "SIWS message has not correct nonce"
        })
      });
      return;
    }
    console.log("successfully checked hash");
    if (Date.parse(siwsInput.issuedAt) < Date.now() - 1e3 * 60 * 60 * 24) {
      console.log("SIWS message expired");
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: "SIWS message expired"
        })
      });
      return;
    }
    if (Date.parse(siwsInput.expirationTime) >= Date.now()) {
      console.log("SIWS message is not yet valid");
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: "SIWS message is not yet valid"
        })
      });
      return;
    }
    if (siwsInput.domain !== "drive.chakra.network" || siwsInput.uri !== "https://drive.chakra.network") {
      console.log("SIWS message has not correct domain");
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: "SIWS message has not correct domain"
        })
      });
      return;
    }
    console.log("reconstructing message");
    const reconstructedMessage = getSiwsMessage(siwsInput);
    const isValid = await verifySiwsSignature(reconstructedMessage, signature, publicKeyBase58);
    console.log("isValid", isValid);
    if (isValid) {
      console.log("Signature is valid.");
      console.log("signature", signature);
      try {
        const decryptedData = await Lit.Actions.decryptAndCombine({
          accessControlConditions: solRpcConditions,
          ciphertext,
          dataToEncryptHash,
          authSig: {
            sig: bytesToHex(decodeBase58(signature)),
            derivedVia: "solana.signMessage",
            signedMessage: reconstructedMessage,
            address: publicKeyBase58
          },
          chain: "solana"
        });
        LitActions.setResponse({ response: decryptedData });
      } catch (error) {
        console.error("Error decrypting data:", error);
        LitActions.setResponse({
          response: JSON.stringify({
            success: false,
            message: "Error decrypting data.",
            error: error.toString()
          })
        });
      }
    } else {
      console.log("Signature is invalid.");
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: "Signature is invalid."
        })
      });
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    LitActions.setResponse({
      response: JSON.stringify({
        success: false,
        message: "Error verifying signature.",
        error: error.toString(),
        stack: error.stack || "No stack trace available"
      })
    });
  }
})();
