export interface User {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
  lastSignIn: Date;
}

export interface VerificationCode {
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export interface SignInState {
  step: 'email' | 'code' | 'name';
  email: string;
  isNewUser: boolean;
  timeLeft: number;
}

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
  name?: string;
}

export interface VerifyCodeResponseData {
  customToken?: string;
  user?: User;
  isNewUser?: boolean;
  nameRequired?: boolean;
}
