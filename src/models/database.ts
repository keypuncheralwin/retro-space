/**
 * Firestore Database Models
 * 
 * This file defines the Firestore document models used in the sign-in flow.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User document in Firestore
 * Collection: 'users'
 * Document ID: User's UID
 */
export interface UserDocument {
  uid: string;
  email: string;
  name: string;       // Display name provided during sign-up
  createdAt: Timestamp | Date;
  lastSignIn: Timestamp | Date;
}

/**
 * Verification code document in Firestore
 * Collection: 'verification_codes'
 * Document ID: User's email address
 */
export interface VerificationCodeDocument {
  email: string;     // Email the code was sent to
  code: string;      // 4-digit verification code
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date;  // Code expires after 15 minutes
  used: boolean;     // Whether code has been used for verification
}
