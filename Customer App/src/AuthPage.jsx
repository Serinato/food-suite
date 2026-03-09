import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Smartphone } from 'lucide-react';
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const AuthPage = ({ onBack, onAuthSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [step, setStep] = useState('PHONE'); // 'PHONE' or 'OTP'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Initialize RecaptchaVerifier when component mounts
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        }

        return () => {
            // Cleanup
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = `+91${phoneNumber}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

            window.confirmationResult = confirmationResult;
            setVerificationId(confirmationResult.verificationId);
            setStep('OTP');
        } catch (err) {
            console.error('Error sending OTP:', err);
            // Simplify error message for user
            if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number format.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Failed to send OTP. Please try again.');
            }

            // Reset recaptcha on error so user can try again
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then((widgetId) => {
                    window.recaptchaVerifier.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await window.confirmationResult.confirm(otp);
            const user = result.user;
            console.log('Successfully signed in:', user.uid);
            onAuthSuccess(user);
        } catch (err) {
            console.error('Error verifying OTP:', err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page fade-in">
            <div className="auth-header">
                <div className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={onBack}>
                    <ArrowLeft size={18} />
                </div>
            </div>

            <div className="auth-content">
                <div className="auth-icon-wrapper">
                    <Smartphone size={32} color="var(--accent-primary)" />
                </div>

                <div className="auth-text-center">
                    <h2 className="auth-title">
                        {step === 'PHONE' ? "Login or Signup" : "Verify Details"}
                    </h2>
                    <p className="auth-subtitle">
                        {step === 'PHONE'
                            ? "Enter your phone number to continue"
                            : `Enter the OTP sent to +91 ${phoneNumber}`}
                    </p>
                </div>

                {error && <div className="modal-error">{error}</div>}

                {step === 'PHONE' ? (
                    <div className="auth-form">
                        <div className="modal-field">
                            <label className="modal-label">Phone Number</label>
                            <div className="modal-phone-row">
                                <span className="modal-phone-prefix">+91</span>
                                <input
                                    type="tel"
                                    className="modal-input"
                                    placeholder="98765 43210"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            className="place-order-btn"
                            onClick={handleSendOtp}
                            disabled={loading || phoneNumber.length < 10}
                            style={{ marginTop: '24px', opacity: (loading || phoneNumber.length < 10) ? 0.6 : 1 }}
                        >
                            {loading ? 'Sending OTP...' : 'Continue'}
                            {!loading && <ChevronRight size={18} />}
                        </button>
                    </div>
                ) : (
                    <div className="auth-form">
                        <div className="modal-field">
                            <label className="modal-label">OTP</label>
                            <input
                                type="number"
                                className="modal-input"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                                maxLength={6}
                                autoFocus
                                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
                            />
                        </div>

                        <button
                            className="place-order-btn"
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            style={{ marginTop: '24px', opacity: (loading || otp.length < 6) ? 0.6 : 1 }}
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                            {!loading && <ChevronRight size={18} />}
                        </button>

                        <button
                            className="modal-skip-btn"
                            onClick={() => {
                                setStep('PHONE');
                                setOtp('');
                                setError('');
                            }}
                            style={{ marginTop: '16px', display: 'block', width: '100%' }}
                        >
                            Change Phone Number
                        </button>
                    </div>
                )}

                <div className="auth-terms">
                    By continuing, you agree to our Terms of Service & Privacy Policy
                </div>

                {/* Required invisible div for Firebase Recaptcha */}
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
};

export default AuthPage;
