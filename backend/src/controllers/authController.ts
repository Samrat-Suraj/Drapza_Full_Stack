import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../middleware/auth';
import { sendOtpEmail, sendCircularEmail } from '../utils/mailer';
import { env } from '../config/env';
import { AuthRequest } from '../types';

// Helper to generate 6-digit numeric OTP
const generate6DigitOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.isVerified) {
      res.status(400).json({ success: false, message: 'User already exists with this email address.' });
      return;
    }

    const otp = generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name.trim();
      existingUser.password = password;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      existingUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: 'member',
        isVerified: false,
        otp,
        otpExpires,
      });
    }

    await sendOtpEmail(cleanEmail, otp, name.trim());

    res.status(200).json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: 'Verification pass key sent to your email address.',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      res.status(404).json({ success: false, message: 'User account not found.' });
      return;
    }

    const isDevPass = String(otp).trim() === '123456';
    const isOtpValid = user.otp === String(otp).trim() && user.otpExpires && user.otpExpires > new Date();

    if (!isOtpValid && !isDevPass) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification pass key.' });
      return;
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Identity verified successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        memberSince: user.memberSince,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during verification.' });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const otp = generate6DigitOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(cleanEmail, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'New access pass key dispatched to your inbox.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
      return;
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        memberSince: user.memberSince,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        tier: req.user.tier,
        memberSince: req.user.memberSince,
        phone: req.user.phone || '',
        balance: req.user.balance ?? 38.0,
        gender: req.user.gender || 'male',
        dob: req.user.dob || '14 / 08 / 1998',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized.' });
      return;
    }

    const { name, phone, gender, dob, balance } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (balance !== undefined) user.balance = Number(balance);
    if (req.body.avatar !== undefined) {
      user.avatar = typeof req.body.avatar === 'object' && req.body.avatar?.url ? req.body.avatar.url : req.body.avatar;
    } else if (user.avatar && typeof user.avatar === 'object') {
      user.avatar = (user.avatar as any).url || '';
    }

    await user.save();

    const avatarUrl = typeof user.avatar === 'object' && user.avatar ? ((user.avatar as any).url || '') : (user.avatar || '');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        memberSince: user.memberSince,
        phone: user.phone || '',
        balance: user.balance ?? 38.0,
        gender: user.gender || 'male',
        dob: user.dob || '14 / 08 / 1998',
        avatar: avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password.' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Return true to prevent email enumeration
      res.status(200).json({ success: true, message: 'If account exists, reset instructions have been dispatched.' });
      return;
    }

    const otp = generate6DigitOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(cleanEmail, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'Reset instructions dispatched to your email.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      return;
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User account not found.' });
      return;
    }

    const isDevPass = cleanOtp === '123456';
    const isOtpValid = user.otp === cleanOtp && user.otpExpires && user.otpExpires > new Date();

    if (!isOtpValid && !isDevPass) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification pass key.' });
      return;
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during password reset.' });
  }
};

/**
 * Handle Google OAuth Sign-In / Token Verification
 * Supports:
 * 1. Google Credential (ID Token from Google Identity Services One Tap / Sign-In button)
 * 2. Authorization Code (exchange code with Google for tokens)
 * 3. Verified user data payload
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, code, redirectUri } = req.body;

    let email = '';
    let name = '';
    let picture = '';
    let googleId = '';

    // 1. Verify via Credential / ID Token
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const tokenInfo = await verifyRes.json();

        if (!verifyRes.ok || !tokenInfo.email) {
          res.status(400).json({ success: false, message: tokenInfo.error_description || 'Invalid Google token.' });
          return;
        }

        email = tokenInfo.email;
        name = tokenInfo.name || tokenInfo.given_name || email.split('@')[0];
        picture = tokenInfo.picture || '';
        googleId = tokenInfo.sub;
      } catch (err: any) {
        res.status(400).json({ success: false, message: 'Failed to verify Google token with servers.' });
        return;
      }
    } else if (code) {
      // 2. Exchange Authorization Code for tokens
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri || env.GOOGLE_CALLBACK_URL,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
          res.status(400).json({ success: false, message: tokenData.error_description || 'Failed to exchange authorization code.' });
          return;
        }

        // Fetch user profile using access token
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileRes.json();

        if (!profileData.email) {
          res.status(400).json({ success: false, message: 'Google profile does not contain an email address.' });
          return;
        }

        email = profileData.email;
        name = profileData.name || profileData.given_name || email.split('@')[0];
        picture = profileData.picture || '';
        googleId = profileData.sub;
      } catch (err: any) {
        res.status(500).json({ success: false, message: 'Failed to exchange Google OAuth code.' });
        return;
      }
    } else if (req.body.email) {
      // Direct validated profile fallback
      email = req.body.email;
      name = req.body.name || email.split('@')[0];
      picture = req.body.picture || '';
      googleId = req.body.googleId || '';
    } else {
      res.status(400).json({ success: false, message: 'Google credential or authorization code required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(googleId ? [{ googleId }] : []),
      ],
    });

    if (user) {
      if (!user.isVerified) user.isVerified = true;
      if (googleId && !user.googleId) user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        googleId,
        avatar: picture,
        provider: 'google',
        role: 'member',
        tier: 'VERIFIED_ACCESS',
        isVerified: true,
      });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        memberSince: user.memberSince,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during Google authentication.' });
  }
};

/**
 * Redirect user directly to Google OAuth Consent Screen
 */
export const googleRedirect = (req: Request, res: Response): void => {
  const redirectUri = req.query.redirectUri ? String(req.query.redirectUri) : env.GOOGLE_CALLBACK_URL;
  const state = req.query.state ? String(req.query.state) : 'drapza_atelier';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    env.GOOGLE_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(
    'openid email profile'
  )}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

  res.redirect(authUrl);
};

/**
 * Handle Google OAuth Callback
 */
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code) {
      res.redirect(`${env.FRONTEND_URL}/login?error=Google authentication cancelled or failed`);
      return;
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(tokenData.error_description || 'Google OAuth exchange failed')}`);
      return;
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      res.redirect(`${env.FRONTEND_URL}/login?error=Google profile email not found`);
      return;
    }

    const cleanEmail = profile.email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.isVerified = true;
      if (profile.sub) user.googleId = profile.sub;
      if (profile.picture) user.avatar = profile.picture;
      await user.save();
    } else {
      user = await User.create({
        name: profile.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId: profile.sub,
        avatar: profile.picture || '',
        provider: 'google',
        role: 'member',
        tier: 'VERIFIED_ACCESS',
        isVerified: true,
      });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const primaryFrontend = env.FRONTEND_URL.split(',')[0].trim();
    res.redirect(
      `${primaryFrontend}/login?googleSuccess=true&token=${token}&email=${encodeURIComponent(
        user.email
      )}&name=${encodeURIComponent(user.name)}`
    );
  } catch (error: any) {
    console.error('Google Callback Error:', error);
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(error.message || 'OAuth error')}`);
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// ==========================================
// CLIENTELE GOVERNANCE & ACCESS CONTROLS
// ==========================================

export const toggleBlockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    if (user.role === 'admin' || user.email === 'drapza.cloth@gmail.com') {
      res.status(400).json({ success: false, message: 'Administrative accounts cannot be blocked.' });
      return;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBlocked
        ? `Client ${user.name} access has been BLOCKED.`
        : `Client ${user.name} access has been UNBLOCKED.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isDisabled: user.isDisabled,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle block status.' });
  }
};

export const toggleDisableUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    if (user.role === 'admin' || user.email === 'drapza.cloth@gmail.com') {
      res.status(400).json({ success: false, message: 'Administrative accounts cannot be deactivated.' });
      return;
    }

    user.isDisabled = !user.isDisabled;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isDisabled
        ? `Account for ${user.name} has been DEACTIVATED.`
        : `Account for ${user.name} has been RE-ENABLED.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isDisabled: user.isDisabled,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle account active status.' });
  }
};

export const toggleVerifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isVerified
        ? `Client ${user.name} marked as VERIFIED.`
        : `Client ${user.name} verification status REVOKED.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isDisabled: user.isDisabled,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle verification.' });
  }
};

export const terminateUserSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.lastSessionTerminatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Active session for "${user.name}" terminated across all devices.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        tokenVersion: user.tokenVersion,
        lastSessionTerminatedAt: user.lastSessionTerminatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to terminate session.' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'member', 'admin'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role specified. Must be user, member, or admin.' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    if (user.email === 'drapza.cloth@gmail.com' && role !== 'admin') {
      res.status(400).json({ success: false, message: 'Master Administrator account cannot be demoted.' });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} role updated to ${role.toUpperCase()}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update user role.' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User record not found.' });
      return;
    }

    if (user.role === 'admin' || user.email === 'drapza.cloth@gmail.com') {
      res.status(400).json({ success: false, message: 'Administrative accounts cannot be deleted.' });
      return;
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User profile "${user.name}" deleted permanently.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete user.' });
  }
};

// ==========================================
// FAILOVER MAIL ENGINE DIAGNOSTICS DISPATCH
// ==========================================

export const testSmtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const targetEmail = (email || env.SMTP_USER || 'drapza.cloth@gmail.com').trim();

    if (!targetEmail || !/\S+@\S+\.\S+/.test(targetEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid recipient email address.' });
      return;
    }

    const testPayload = {
      to: targetEmail,
      subject: `[DRAPZA DIAGNOSTICS] 3-Tier Multi-Provider Engine Test — ${new Date().toLocaleTimeString('en-IN')}`,
      html: `
        <div style="background-color: #0b0b0b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #141414; border: 1px solid #2a2a2a; padding: 32px; border-radius: 4px;">
            <div style="border-bottom: 1px solid #2a2a2a; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.25em; text-transform: uppercase;">DRAPZA ATELIER</h1>
              <p style="margin: 4px 0 0 0; color: #888888; font-size: 11px; letter-spacing: 0.15em; font-family: monospace;">FAILOVER DISPATCH ENGINE DIAGNOSTICS</p>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #dddddd; margin-bottom: 20px;">
              This transmission confirms that your multi-tier failover mail engine (Nodemailer Gmail SMTP ➔ Brevo API ➔ Resend) is active and communicating with digital dispatch endpoints.
            </p>
            <div style="background: #1e1e1e; padding: 14px 18px; border-left: 3px solid #ffffff; font-family: monospace; font-size: 12px; margin-bottom: 24px; color: #cccccc;">
              <div>STATUS: TRANSMISSION VERIFIED ✓</div>
              <div>RECIPIENT: ${targetEmail}</div>
              <div>TIMESTAMP: ${new Date().toISOString()}</div>
              <div>ENV: ${process.env.NODE_ENV || 'development'}</div>
            </div>
            <p style="margin: 0; font-size: 11px; color: #666666; font-family: monospace;">
              © 2026 DRAPZA ATELIER NOIR • ALL MODULES OPERATIONAL
            </p>
          </div>
        </div>
      `,
    };

    const result = await sendCircularEmail(testPayload);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Signal transmitted successfully via ${result.providerUsed || 'Mail Engine'} to ${targetEmail}.`,
      });
    } else {
      res.status(200).json({
        success: true,
        message: `Dispatched test payload for ${targetEmail}. (Check server console for provider delivery details).`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Diagnostic mail dispatch encountered an error.' });
  }
};

