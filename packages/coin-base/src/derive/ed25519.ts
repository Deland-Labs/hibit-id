import { base, bip39, signUtil } from '@delandlabs/crypto-lib';

/**
 * WARNING: This function is for testing purposes only.
 * DO NOT use this function for production signing operations.
 * @param privateKey - The private key to test
 * @returns boolean - Whether the test signature is valid
 */
export function ed25519SignTest(privateKey: Buffer) {
  const testMsg = base.randomBytes(32);
  const msgHash = base.sha256(testMsg);
  const publicKey = signUtil.ed25519.publicKeyCreate(privateKey);
  const signature = signUtil.ed25519.sign(msgHash, privateKey);
  const result = signUtil.ed25519.verify(msgHash, signature, publicKey);
  // Clear sensitive data
  testMsg.fill(0);
  msgHash.fill(0);
  publicKey.fill(0);
  signature.fill(0);
  return result;
}

/**
 * ed25519 Gets random private key
 *
 * @param concatPub - whether to add 32bytes public key (e.g. solana private key is 64bytes)
 * @param encode - private key encoding format, supporting hex and base58. For example, solana requires a base58 encoded private key
 * @returns string - Private key
 */
function getRandomEd25519PrivateKey(concatPub: boolean, encode: 'hex' | 'base58'): string {
  const MAX_ATTEMPTS = 100;
  let attempts = 0;
  while (true) {
    if (attempts++ >= MAX_ATTEMPTS) {
      throw new Error('Failed to generate valid private key after maximum attempts');
    }
    const randBytes = base.randomBytes(32);
    if (signUtil.ed25519.privateKeyVerify(randBytes)) {
      if (ed25519SignTest(randBytes)) {
        const publicKey = signUtil.ed25519.publicKeyCreate(randBytes);
        const privateKey: Uint8Array = concatPub ? base.concatBytes(randBytes, publicKey) : randBytes;
        // Clear sensitive data
        randBytes.fill(0);
        if (concatPub) publicKey.fill(0);
        return encode === 'base58' ? base.toBase58(privateKey) : base.toHex(privateKey);
      }
    }
    randBytes.fill(0);
  }
}

const pathRegex = /^m(\/[0-9]+')+$/;
const replaceDerive = (val: string): string => val.replace("'", '');
const HARDENED_OFFSET = 0x80000000;

type Keys = {
  key: Uint8Array;
  chainCode: Uint8Array;
};

function getMasterKeyFromSeed(seed: Uint8Array) {
  const I = Uint8Array.from(base.hmacSHA512('ed25519 seed', seed));
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  // Clear sensitive data
  I.fill(0);
  return {
    key: IL,
    chainCode: IR
  };
}

function CKDPriv({ key, chainCode }: Keys, index: number): Keys {
  const indexBuffer = Buffer.allocUnsafe(4);
  indexBuffer.writeUInt32BE(index, 0);

  const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);
  const I = Uint8Array.from(base.hmacSHA512(chainCode, data));
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  // Clear sensitive data
  I.fill(0);
  data.fill(0);
  indexBuffer.fill(0);
  return {
    key: IL,
    chainCode: IR
  };
}

const isValidPath = (path: string): boolean => {
  if (!pathRegex.test(path)) {
    return false;
  }
  return !path
    .split('/')
    .slice(1)
    .map(replaceDerive)
    .some(Number.isNaN as any /* ts T_T*/);
};

function derivePath(path: string, seed: Uint8Array, offset = HARDENED_OFFSET): Keys {
  if (!isValidPath(path)) {
    throw new Error('Invalid derivation path');
  }

  const { key, chainCode } = getMasterKeyFromSeed(seed);
  const segments = path
    .split('/')
    .slice(1)
    .map(replaceDerive)
    .map((el) => parseInt(el, 10));

  return segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), { key, chainCode });
}

/**
 * ed25519 Gets the derived private key
 *
 * @param mnemonic - mnemonic
 * @param hdPath - derivation path
 * @param concatPub - whether to add 32bytes public key (e.g. solana private key is 64bytes)
 * @param encode - private key encoding format, supporting hex and base58. For example, solana requires a base58 encoded private key
 * @returns string - Private key
 */
async function getEd25519DerivedPrivateKey(
  mnemonic: string,
  hdPath: string,
  concatPub: boolean,
  encode: 'hex' | 'base58'
): Promise<string> {
  if (!mnemonic) {
    throw new Error('Mnemonic is required');
  }
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  if (!['hex', 'base58'].includes(encode)) {
    throw new Error('Invalid encoding format');
  }

  const seed = await bip39.mnemonicToSeed(mnemonic) ;
  const derivedSeed = derivePath(hdPath, seed).key;
  const publicKey = signUtil.ed25519.publicKeyCreate(derivedSeed);
  const privateKey = concatPub ? base.concatBytes(derivedSeed, publicKey) : derivedSeed;

  // Clear sensitive data
  seed.fill(0);

  return encode === 'base58' ? Promise.resolve(base.toBase58(privateKey)) : Promise.resolve(base.toHex(privateKey));
}

export { isValidPath, getEd25519DerivedPrivateKey, getRandomEd25519PrivateKey };
