import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { generateFourDigitCode } from '@/lib/utils';

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('RESEND_API_KEY is not set. Email functionality will be disabled.');
}
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'RetroSpace <noreply@yourdomain.com>'; // Replace with your actual domain or a Resend verified domain
const CODE_EXPIRATION_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;

export async function POST(request: Request) {
  if (!resend) {
    console.error('Resend client is not initialized because RESEND_API_KEY is missing.');
    return NextResponse.json({ error: 'Email service is currently unavailable.' }, { status: 503 });
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required and must be a string.' }, { status: 400 });
    }

    // Validate email format (simple regex)
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const verificationCodesRef = adminDb.collection('verificationCodes');
    const now = new Date();

    // Check for cooldown: if a code was sent recently for this email
    const recentCodeQuery = await verificationCodesRef
      .where('email', '==', email)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!recentCodeQuery.empty) {
      const lastCodeData = recentCodeQuery.docs[0].data();
      // Ensure createdAt is a Firestore Timestamp and convert to Date
      const lastCodeTime = lastCodeData.createdAt.toDate ? lastCodeData.createdAt.toDate() : new Date(lastCodeData.createdAt);
      const secondsSinceLastCode = (now.getTime() - lastCodeTime.getTime()) / 1000;

      if (secondsSinceLastCode < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastCode)} seconds before requesting a new code.` },
          { status: 429 } // Too Many Requests
        );
      }
    }

    const code = generateFourDigitCode();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    // Store the new code in Firestore
    // Note: Firestore automatically converts Date objects to Timestamps
    await verificationCodesRef.add({
      email,
      code,
      createdAt: now, // Will be stored as Firestore Timestamp
      expiresAt,   // Will be stored as Firestore Timestamp
      used: false, // To mark if the code has been successfully used
    });

    // Send email using Resend
    try {
      const { data, error: resendError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: 'Your RetroSpace Verification Code',
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in ${CODE_EXPIRATION_MINUTES} minutes.</p>`,
      });

      if (resendError) {
        console.error('Resend error:', resendError);
        return NextResponse.json({ error: 'Failed to send verification email.', details: resendError.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Verification code sent successfully.' }, { status: 200 });

    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return NextResponse.json({ error: 'Failed to send verification email.', details: emailError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Send code API error:', error);
    // Check if the error is due to invalid JSON payload
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON payload. Please ensure the request body is valid JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
