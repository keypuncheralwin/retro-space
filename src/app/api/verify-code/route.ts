import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ApiResponse, VerifyCodeRequest, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, code, name }: VerifyCodeRequest = await request.json();

    if (!email || !code) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email and code are required'
      }, { status: 400 });
    }

    // Get verification code from Firestore
    const verificationDoc = await adminDb.collection('verification_codes').doc(email).get();
    
    if (!verificationDoc.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid verification code'
      }, { status: 400 });
    }

    const verificationData = verificationDoc.data();
    
    // Check if code matches and hasn't been used
    if (verificationData?.code !== code || verificationData?.used) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired verification code'
      }, { status: 400 });
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = verificationData.expiresAt.toDate();
    
    if (now > expiresAt) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Verification code has expired'
      }, { status: 400 });
    }

    let user;
    let isNewUser = false;

    try {
      // Try to get existing user
      user = await adminAuth.getUserByEmail(email);
      
      // For existing users, mark code as used immediately
      await adminDb.collection('verification_codes').doc(email).update({ used: true });
    } catch (error) {
      // User doesn't exist - check if name is provided
      if (!name) {
        // If no name is provided for a new user, return with nameRequired flag
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { nameRequired: true }
        });
      }
      
      // Name is provided, create the new user
      user = await adminAuth.createUser({
        email,
        emailVerified: true,
        displayName: name,
      });
      isNewUser = true;
      
      // For new users with name, mark code as used after successful user creation
      await adminDb.collection('verification_codes').doc(email).update({ used: true });
    }

    // Store/update user data in Firestore
    const userData: User = {
      uid: user.uid,
      email,
      name: name || user.displayName || '',
      createdAt: isNewUser ? new Date() : (await adminDb.collection('users').doc(user.uid).get()).data()?.createdAt?.toDate() || new Date(),
      lastSignIn: new Date(),
    };

    await adminDb.collection('users').doc(user.uid).set(userData, { merge: true });

    // Create custom token for client authentication
    const customToken = await adminAuth.createCustomToken(user.uid);

    // Set auth cookie
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        customToken, 
        user: userData,
        isNewUser
      }
    });

    // Set a simple auth cookie for middleware routing
    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to verify code'
    }, { status: 500 });
  }
}