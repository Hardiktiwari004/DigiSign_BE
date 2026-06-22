/**
 * Audit action enum.
 * Every significant platform action generates an audit record using one of these actions.
 * Enables full auditability, compliance, and admin dashboard reporting.
 */
export enum AuditAction {
  // Auth events
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN = 'USER_LOGIN',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',

  // Document lifecycle events
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VIEWED = 'DOCUMENT_VIEWED',
  DOCUMENT_SIGNED = 'DOCUMENT_SIGNED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',

  // Verification events
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
}
