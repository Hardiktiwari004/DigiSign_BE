/**
 * User role enum.
 * USER: Standard authenticated user with access to their own documents.
 * ADMIN: Elevated access — can view all documents and admin dashboard.
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
