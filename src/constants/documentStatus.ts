/**
 * Document lifecycle status enum.
 * UPLOADED: PDF has been uploaded but not yet signed.
 * IN_PROGRESS: Signing process has begun (reserved for multi-signer flows).
 * SIGNED: Document has been fully signed and signed PDF is available.
 */
export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  IN_PROGRESS = 'IN_PROGRESS',
  SIGNED = 'SIGNED',
}
