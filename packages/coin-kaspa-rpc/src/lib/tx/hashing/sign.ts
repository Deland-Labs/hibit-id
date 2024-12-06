import { SignableTransaction } from '../generator/model';
import { SignedTransaction, SignedType } from '../generator/model/signed-tx';
import { Keypair } from 'src/lib/keypair';
import { base } from '@delandlabs/crypto-lib';
import { SIG_HASH_ALL } from './sig-hash-type';
import { TransactionSigningHashing } from './tx-sig';

/**
 * Sign a transaction using Schnorr.
 * @param {SignableTransaction} signableTx - The transaction to be signed.
 * @param {string[]} privHexKeys - The private keys to sign the transaction with.
 * @returns {SignedTransaction} The signed transaction.
 */
export function signWithMultipleV2(signableTx: SignableTransaction, privHexKeys: string[]): SignedTransaction {
  const map = new Map<string, Keypair>();
  for (const privkey of privHexKeys) {
    const keypair = Keypair.fromPrivateKeyHex(privkey);
    const scriptPubKeyScript = new Uint8Array([0x20, ...base.fromHex(keypair.xOnlyPublicKey!), 0xac]);
    map.set(scriptPubKeyScript.toString(), keypair);
  }

  let additionalSignaturesRequired = false;
  for (let i = 0; i < signableTx.tx.inputs.length; i++) {
    const script = signableTx.entries[i].scriptPublicKey.script;
    const schnorrKey = map.get(script.toString());
    if (schnorrKey) {
      const sigHash = TransactionSigningHashing.calcSchnorrSignatureHash(signableTx, i, SIG_HASH_ALL);
      const sig = schnorrKey.sign(sigHash.toBytes());
      signableTx.tx.inputs[i].signatureScript = new Uint8Array([65, ...sig, SIG_HASH_ALL.value]);
    } else {
      additionalSignaturesRequired = true;
    }
  }

  const signedTxType = additionalSignaturesRequired ? SignedType.Partially : SignedType.Fully;
  return new SignedTransaction(signedTxType, signableTx);
}