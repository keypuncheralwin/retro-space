import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  console.log('🚀 [API] verify-code endpoint called');
  try {
    const { email, code } = await request.json();
    console.log('📧 [API] Processing verification for email:', email, 'code length:', code?.length);

    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      console.log('❌ [API] Invalid request parameters');
      return NextResponse.json({ error: 'Email and code are required and must be strings.' }, { status: 400 });
    }

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      console.log('❌ [API] Invalid email format');
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(code)) {
      console.log('❌ [API] Invalid code format');
      return NextResponse.json({ error: 'Invalid code format. Must be 4 digits.' }, { status: 400 });
    }

    console.log('🔍 [API] Checking verification code in Firestore');
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
      console.log('❌ [API] No matching verification code found');
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }

    const codeDoc = codeQuery.docs[0];
    const codeData = codeDoc.data();
    console.log('✅ [API] Verification code found:', codeDoc.id);

    // Check if code is used
    if (codeData.used) {
      console.log('❌ [API] Code already used');
      return NextResponse.json({ error: 'This verification code has already been used.' }, { status: 400 });
    }

    // Check if code is expired
    const expiresAt = codeData.expiresAt.toDate(); // Convert Firestore Timestamp to Date
    if (now > expiresAt) {
      console.log('❌ [API] Code expired');
      return NextResponse.json({ error: 'Verification code has expired.' }, { status: 400 });
    }

    // Mark code as used
    console.log('✅ [API] Marking code as used');
    await codeDoc.ref.update({ used: true });

    let uid;
    let isNewUser = false;

    console.log('🔍 [API] Checking if user exists in Firebase Auth');
    try {
      // Check if user exists in Firebase Auth
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log('✅ [API] Existing user found:', uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('🆕 [API] User not found, creating new user');
        // User does not exist, create a new user
        const newUserRecord = await adminAuth.createUser({ email });
        uid = newUserRecord.uid;
        isNewUser = true;
        console.log('✅ [API] New user created:', uid, 'isNewUser set to:', isNewUser);
      } else {
        // Other Firebase Auth error
        console.error('❌ [API] Firebase Auth error (getUserByEmail):', error);
        return NextResponse.json({ error: 'Authentication error.', details: error.message }, { status: 500 });
      }
    }

    // Check if user has a display name
    console.log('🔍 [API] Checking if user has profile data in Firestore');
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const hasUserProfile = userDoc.exists && userDoc.data()?.displayName;
    console.log('🔍 [API] User profile exists:', userDoc.exists, 'Has display name:', hasUserProfile);
    
    // If user exists but has no profile, also mark as new user for name input
    if (!hasUserProfile && !isNewUser) {
      console.log('🆕 [API] Existing user but no profile, treating as new user');
      isNewUser = true;
    }

    // Generate custom token
    console.log('🔑 [API] Generating custom token for uid:', uid);
    const customToken = await adminAuth.createCustomToken(uid);
    
    // Log the isNewUser value to confirm what's being sent
    console.log('🚀 [API] Returning response with isNewUser:', isNewUser, 'Type:', typeof isNewUser);
    
    // Return a clear boolean value for isNewUser to ensure it's properly interpreted
    return NextResponse.json({ 
      customToken, 
      isNewUser: isNewUser === true, 
      uid,
      hasProfile: hasUserProfile === true
    }, { status: 200 });

  } catch (error: any) {
    console.error('Verify code API error:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
