import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Email and code are required and must be strings.' }, { status: 400 });
    }

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({ error: 'Invalid code format. Must be 4 digits.' }, { status: 400 });
    }

    const verificationCodesRef = adminDb.collection('verificationCodes');
    const now = new Date();

    // Query for the code
    const codeQuery = await verificationCodesRef
      .where('email', '==', email)
      .where('code', '==', code)
      .orderBy('createdAt', 'desc') // Get the latest one if multiple (shouldn't happen with proper logic)
      .limit(1)
      .get();

    if (codeQuery.empty) {
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }

    const codeDoc = codeQuery.docs[0];
    const codeData = codeDoc.data();

    // Check if code is used
    if (codeData.used) {
      return NextResponse.json({ error: 'This verification code has already been used.' }, { status: 400 });
    }

    // Check if code is expired
    const expiresAt = codeData.expiresAt.toDate(); // Convert Firestore Timestamp to Date
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Verification code has expired.' }, { status: 400 });
    }

    // Mark code as used
    await codeDoc.ref.update({ used: true });

    let uid;
    let isNewUser = false;

    try {
      // Check if user exists in Firebase Auth
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User does not exist, create a new user
        const newUserRecord = await adminAuth.createUser({ email });
        uid = newUserRecord.uid;
        isNewUser = true;
      } else {
        // Other Firebase Auth error
        console.error('Firebase Auth error (getUserByEmail):', error);
        return NextResponse.json({ error: 'Authentication error.', details: error.message }, { status: 500 });
      }
    }

    // Generate custom token
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ customToken, isNewUser, uid }, { status: 200 });

  } catch (error: any) {
    console.error('Verify code API error:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
