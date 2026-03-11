import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { Store } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const LoginView = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          setAuthError('reCAPTCHA expired. Please try again.');
        }
      });
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Error with Google Sign-In:', error);
      setAuthError('Google Sign-In failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setAuthError('Please enter a valid 10-digit number');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const formattedPhone = `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

      window.confirmationResult = confirmationResult;
      setAuthStep('OTP');
    } catch (err: any) {
      console.error('DIAGNOSTIC - Full Error Sending OTP:', err);
      console.dir(err);
      if (err.stack) console.error('Stack Trace:', err.stack);
      
      if (err.code === 'auth/invalid-phone-number') {
        setAuthError('Invalid phone number format.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Too many attempts. Please try again later.');
      } else {
        setAuthError(`Failed to send OTP: ${err.message} (${err.code})`);
      }
      
      if (window.recaptchaVerifier && typeof window.recaptchaVerifier.reset === 'function') {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          (window.recaptchaVerifier as any).reset(widgetId);
        });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setAuthError('Please enter a valid 6-digit OTP');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (window.confirmationResult) {
        await window.confirmationResult.confirm(otp);
        console.log('Successfully signed in with Phone');
      } else {
        setAuthError('Session expired. Please request OTP again.');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setAuthError('Invalid OTP. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Store size={48} color="var(--primary)" />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Merchant Portal</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '32px' }}>
          {authStep === 'PHONE' ? 'Login or Signup using your mobile number' : `Enter the OTP sent to +91 ${phoneNumber}`}
        </p>

        {authError && <div className="modal-error" style={{ marginBottom: '20px' }}>{authError}</div>}

        {authStep === 'PHONE' ? (
          <div className="auth-form">
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', padding: '0 12px', background: 'var(--surface)' }}>
                <span style={{ color: 'var(--text-light)', marginRight: '8px', fontWeight: '500' }}>+91</span>
                <input
                  type="tel"
                  style={{ border: 'none', padding: '12px 0', width: '100%', fontSize: '16px', outline: 'none', background: 'transparent' }}
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>

            <button
              className="primary-btn"
              onClick={handleSendOtp}
              disabled={authLoading || phoneNumber.length < 10}
              style={{ width: '100%', opacity: (authLoading || phoneNumber.length < 10) ? 0.6 : 1, padding: '14px' }}
            >
              {authLoading ? 'Sending OTP...' : 'Continue with Phone'}
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="google-btn"
              disabled={authLoading}
              style={{ opacity: authLoading ? 0.6 : 1 }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>OTP</label>
              <input
                type="number"
                style={{ border: '1px solid var(--border)', padding: '12px 16px', width: '100%', fontSize: '20px', outline: 'none', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center', letterSpacing: '4px' }}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              className="primary-btn"
              onClick={handleVerifyOtp}
              disabled={authLoading || otp.length < 6}
              style={{ width: '100%', opacity: (authLoading || otp.length < 6) ? 0.6 : 1, padding: '14px', marginBottom: '16px' }}
            >
              {authLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              onClick={() => {
                setAuthStep('PHONE');
                setOtp('');
                setAuthError('');
              }}
              className="secondary-btn"
              style={{ width: '100%', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Change Phone Number
            </button>
          </div>
        )}

        {/* Required invisible div for Firebase Recaptcha */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default LoginView;
