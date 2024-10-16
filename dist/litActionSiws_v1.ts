/* eslint-disable*/
// @ts-nocheck
// NOTE: DO NOT MODIFY THIS FILE – if you do it will break decryption for all previously uploaded files
import { decodeBase58 } from 'https://deno.land/std@0.224.0/encoding/base58.ts';

function getSiwsMessage(siwsInput) {
  let message = `${siwsInput.domain} wants you to sign in with your Solana account:\n${siwsInput.address}`;

  if (siwsInput.statement) {
    message += `\n\n${siwsInput.statement}`;
  }

  const fields = [];

  if (siwsInput.uri !== undefined) fields.push(`URI: ${siwsInput.uri}`);
  if (siwsInput.version !== undefined) fields.push(`Version: ${siwsInput.version}`);
  if (siwsInput.chainId !== undefined) fields.push(`Chain ID: ${siwsInput.chainId}`);
  if (siwsInput.nonce !== undefined) fields.push(`Nonce: ${siwsInput.nonce}`);
  if (siwsInput.issuedAt !== undefined) fields.push(`Issued At: ${siwsInput.issuedAt}`);
  if (siwsInput.expirationTime !== undefined)
    fields.push(`Expiration Time: ${siwsInput.expirationTime}`);
  if (siwsInput.notBefore !== undefined) fields.push(`Not Before: ${siwsInput.notBefore}`);
  if (siwsInput.requestId !== undefined) fields.push(`Request ID: ${siwsInput.requestId}`);
  if (siwsInput.resources !== undefined && siwsInput.resources.length > 0) {
    fields.push('Resources:');
    for (const resource of siwsInput.resources) {
      fields.push(`- ${resource}`);
    }
  }

  if (fields.length > 0) {
    message += `\n\n${fields.join('\n')}`;
  }

  return message;
}

async function verifySiwsSignature(
  message: string,
  signatureBase58: string,
  publicKeyBase58: string
) {
  // Convert message to Uint8Array
  const messageBytes = new TextEncoder().encode(message);

  try {
    const signatureBytes = decodeBase58(signatureBase58);
    const publicKeyBytes = decodeBase58(publicKeyBase58);

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      },
      false,
      ['verify']
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify('Ed25519', publicKey, signatureBytes, messageBytes);

    return isValid;
  } catch (error) {
    console.error('Error in verifySiwsSignature:', error);
    throw error;
  }
}

function bytesToHex(uint8arr) {
  if (!uint8arr) return '';
  return Array.from(uint8arr)
    .map(byte => `0${(byte & 0xff).toString(16)}`.slice(-2))
    .join('');
}

(async () => {
  try {
    const _siwsObject = JSON.parse(siwsObject);
    const { siwsInput } = _siwsObject;
    const { signature } = _siwsObject;
    const publicKeyBase58 = siwsInput.address;

    if (
      siwsInput.statement !==
      'ONLY SIGN THIS MESSAGE IF YOU ARE SIGNING ON drive.chakra.network. DO NOT SIGN THIS MESSAGE IF YOU ARE SIGNING ON ANY OTHER SITE.'
    ) {
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: 'Invalid SIWS message',
          error: error.toString(),
        }),
      });
      return;
    }

    if (Date.parse(siwsInput.issuedAt) < Date.now() - 1000 * 60 * 60 * 24) {
      // if it's more than 1 day old, reject
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: 'SIWS message expired',
        }),
      });
      return;
    }

    if (Date.parse(siwsInput.expirationTime) >= Date.now()) {
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: 'SIWS message is not yet valid',
        }),
      });
      return;
    }

    if (
      siwsInput.domain !== 'drive.chakra.network' ||
      siwsInput.uri !== 'https://drive.chakra.network'
    ) {
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: 'SIWS message has not correct domain',
        }),
      });
      return;
    }

    // Use the exact message that was signed
    const reconstructedMessage = getSiwsMessage(siwsInput);

    const isValid = await verifySiwsSignature(reconstructedMessage, signature, publicKeyBase58);

    console.log('isValid', isValid);

    if (isValid) {
      console.log('Signature is valid.');
      console.log('signature', signature);

      try {
        const decryptedData = await Lit.Actions.decryptAndCombine({
          accessControlConditions: solRpcConditions,
          ciphertext,
          dataToEncryptHash,
          authSig: {
            sig: bytesToHex(decodeBase58(signature)),
            derivedVia: 'solana.signMessage',
            signedMessage: reconstructedMessage,
            address: publicKeyBase58,
          },
          chain: 'solana',
        });
        LitActions.setResponse({ response: decryptedData });
      } catch (error) {
        console.error('Error decrypting data:', error);
        LitActions.setResponse({
          response: JSON.stringify({
            success: false,
            message: 'Error decrypting data.',
            error: error.toString(),
          }),
        });
      }
    } else {
      console.log('Signature is invalid.');
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          message: 'Signature is invalid.',
        }),
      });
    }
  } catch (error) {
    console.error('Error verifying signature:', error);
    LitActions.setResponse({
      response: JSON.stringify({
        success: false,
        message: 'Error verifying signature.',
        error: error.toString(),
        stack: error.stack || 'No stack trace available',
      }),
    });
  }
})();
