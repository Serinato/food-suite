import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { Store, Flame } from 'lucide-react';
import './Login.css';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
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
      if (err.code === 'auth/invalid-phone-number') setAuthError('Invalid phone number format.');
      else if (err.code === 'auth/too-many-requests') setAuthError('Too many attempts. Please try again later.');
      else setAuthError(`Failed to send OTP: ${err.message}`);
      
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
      } else {
        setAuthError('Session expired. Please request OTP again.');
      }
    } catch (err: any) {
      setAuthError('Invalid OTP. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="login-container slide-up">
      <div className="login-box glass-card">
        <div className="login-logo fade-in">
          <div className="logo-circle">
            <Flame size={40} color="#fff" />
          </div>
        </div>
        <h1>Kitchen Portal</h1>
        <p className="login-subtitle">
          {authStep === 'PHONE' ? 'Login or Signup using your mobile number' : `Enter the OTP sent to +91 ${phoneNumber}`}
        </p>

        {authError && <div className="modal-error slide-up">{authError}</div>}

        {authStep === 'PHONE' ? (
          <div className="auth-form fade-in">
            <div className="input-group">
              <label>Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>

            <button className="styled-btn-primary full-width mt-4" onClick={handleSendOtp} disabled={authLoading || phoneNumber.length < 10}>
              {authLoading ? 'Sending OTP...' : 'Continue with Phone'}
            </button>

            <div className="login-divider"><span>OR</span></div>

            <button onClick={handleGoogleLogin} className="google-btn full-width" disabled={authLoading}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="auth-form fade-in">
            <div className="input-group">
              <label>OTP</label>
              <input
                type="number"
                className="otp-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                maxLength={6}
                autoFocus
              />
            </div>

            <button className="styled-btn-primary full-width mt-4 mb-2" onClick={handleVerifyOtp} disabled={authLoading || otp.length < 6}>
              {authLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button onClick={() => { setAuthStep('PHONE'); setOtp(''); setAuthError(''); }} className="styled-btn-secondary full-width">
              Change Phone Number
            </button>
          </div>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;
