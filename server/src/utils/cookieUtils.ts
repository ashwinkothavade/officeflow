import { Response } from 'express';

/**
 * Sets a secure HTTP-only cookie with proper configuration
 * @param res Express Response object
 * @param name Cookie name
 * @param value Cookie value
 * @param options Additional cookie options
 */
export const setSecureCookie = (
  res: Response,
  name: string,
  value: string,
  options: {
    maxAge?: number;
    domain?: string;
    path?: string;
    sameSite?: 'lax' | 'strict' | 'none';
    secure?: boolean;
    httpOnly?: boolean;
  } = {}
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultOptions: {
    maxAge: number;
    path: string;
    sameSite: 'lax' | 'none' | 'strict' | boolean;
    secure: boolean;
    httpOnly: boolean;
    domain?: string;
  } = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    httpOnly: true,
    domain: isProduction ? '.officeflow-app.vercel.app' : 'localhost',
  };

  const cookieOptions = { ...defaultOptions, ...options };

  console.log(`Setting cookie '${name}' with options:`, {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    domain: cookieOptions.domain,
    httpOnly: cookieOptions.httpOnly,
    maxAge: cookieOptions.maxAge
  });

  res.cookie(name, value, cookieOptions);
};

/**
 * Clears a cookie by setting its expiration to a past date
 * @param res Express Response object
 * @param name Cookie name
 */
export const clearCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.officeflow-app.vercel.app' : undefined,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};
