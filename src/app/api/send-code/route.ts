import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { ApiResponse, SendCodeRequest, VerificationCode } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email }: SendCodeRequest = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Valid email is required'
      }, { status: 400 });
    }

    // Check for cooldown period (1 minute)
    const cooldownPeriod = 1 * 60 * 1000; 
    const currentTime = Date.now();

    const docRef = adminDb.collection('verification_codes').doc(email);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const createdAt = data?.createdAt?.toDate();

      if (createdAt && createdAt.getTime() + cooldownPeriod > currentTime) {
        const remainingTime = Math.ceil((createdAt.getTime() + cooldownPeriod - currentTime) / 1000);
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Please wait ${remainingTime} seconds before requesting a new code.`
        }, { status: 429 });
      }
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();

    // Store verification code in Firestore
    const verificationData: VerificationCode = {
      email,
      code,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes like reference
      used: false,
    };

    await docRef.set(verificationData);

    // Send email with Resend
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: 'Your Sign-In Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your Sign-In Code</h2>
            <p style="font-size: 16px; color: #666;">
              Use the following code to sign in to your account:
            </p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
                ${code}
              </span>
            </div>
            <p style="font-size: 14px; color: #999;">
              This code will expire in 15 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to send verification email'
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Verification code sent successfully' }
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to send verification code'
    }, { status: 500 });
  }
}