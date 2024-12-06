import { Hash, ZERO_HASH } from './hash';
import { Blake2bHashKey, Sha256HashKey } from './hash-key';
import { SigHashType } from './sig-hash-type';
import { Transaction } from 'src/lib/tx/tx.ts';
import { blake2, sha256 } from '@delandlabs/crypto-lib/dist/base';
import { SignableTransaction } from 'src/lib/tx/generator/model';
import { DataWriter } from './data-writer';
import { Buffer } from 'buffer';

/**
 * Class providing methods for calculating transaction signing hashes.
 */
class TransactionSigningHashing {
  /**
   * Calculates the hash of previous outputs for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  private static previousOutputsHash(tx: Transaction, hashType: SigHashType): Hash {
    if (hashType.isSighashAnyoneCanPay()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    for (const input of tx.inputs) {
      writer.writeOutpoint(input.previousOutpoint);
    }

    return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
  }

  /**
   * Calculates the hash of sequences for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  private static sequencesHash(tx: Transaction, hashType: SigHashType): Hash {
    if (hashType.isSighashSingle() || hashType.isSighashAnyoneCanPay() || hashType.isSighashNone()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    for (const input of tx.inputs) {
      writer.writeUint64(input.sequence);
    }

    return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
  }

  /**
   * Calculates the hash of signature operation counts for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  private static sigOpCountsHash(tx: Transaction, hashType: SigHashType): Hash {
    if (hashType.isSighashAnyoneCanPay()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    for (const input of tx.inputs) {
      writer.writeUint8(input.sigOpCount);
    }

    return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
  }

  /**
   * Calculates the hash of the payload for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @returns {Hash} - The calculated hash.
   */
  private static payloadHash(tx: Transaction): Hash {
    if (tx.subnetworkId.isNative() && tx.payload.length === 0) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    writer.writeDataWithLength(tx.payload);

    return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
  }

  /**
   * Calculates the hash of outputs for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @param {number} inputIndex - The index of the input.
   * @returns {Hash} - The calculated hash.
   */
  private static outputsHash(tx: Transaction, hashType: SigHashType, inputIndex: number): Hash {
    if (hashType.isSighashNone()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    if (hashType.isSighashSingle()) {
      if (inputIndex >= tx.outputs.length) {
        return ZERO_HASH;
      }

      writer.writeOutput(tx.outputs[inputIndex]);
      return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
    }

    for (const output of tx.outputs) {
      writer.writeOutput(output);
    }
    return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
  }

  /**
   * Calculates the Schnorr signature hash for a transaction.
   * @param {SignableTransaction} signableTx - The signable transaction object.
   * @param {number} inputIndex - The index of the input.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  static calcSchnorrSignatureHash(signableTx: SignableTransaction, inputIndex: number, hashType: SigHashType): Hash {
    const [input, utxo] = signableTx.populatedInput(inputIndex);
    const tx = signableTx.tx;
    const writer = new DataWriter();
    writer
      .writeUint16(tx.version)
      .writeRawData(this.previousOutputsHash(tx, hashType).toBytes())
      .writeRawData(this.sequencesHash(tx, hashType).toBytes())
      .writeRawData(this.sigOpCountsHash(tx, hashType).toBytes())
      .writeOutpoint(input.previousOutpoint)
      .writeScriptPublicKey(utxo.scriptPublicKey)
      .writeUint64(utxo.amount)
      .writeUint64(input.sequence)
      .writeUint8(input.sigOpCount)
      .writeRawData(this.outputsHash(tx, hashType, inputIndex).toBytes())
      .writeUint64(tx.lockTime)
      .writeRawData(tx.subnetworkId.bytes)
      .writeUint64(tx.gas)
      .writeRawData(this.payloadHash(tx).toBytes())
      .writeUint8(hashType.value);
    return new Hash(blake2(writer.buffer, 256, Blake2bHashKey.TransactionSigning));
  }

  /**
   * Calculates the ECDSA signature hash for a transaction.
   * @param {SignableTransaction} tx - The signable transaction object.
   * @param {number} inputIndex - The index of the input.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  static calcEcdsaSignatureHash(tx: SignableTransaction, inputIndex: number, hashType: SigHashType): Hash {
    const hash = this.calcSchnorrSignatureHash(tx, inputIndex, hashType);
    const bytes = Buffer.concat([Sha256HashKey.TransactionSigningHashECDSA, hash.toBytes()]);
    return new Hash(sha256(bytes));
  }
}

export { TransactionSigningHashing };