import React, { useState } from 'react';
import { X, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function PremiumModal({ isOpen, onClose }) {
    const [utrNumber, setUtrNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const UPI_ID = 'saifsid1930@okicici'; // Put User's actual UPI ID here.
    const UPI_NAME = 'GoJob Premium';
    const AMOUNT = '99.00';

    if (!isOpen) return null;

    // Generate RBI-compliant UPI intent string
    const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${AMOUNT}&cu=INR&tn=GoJob_Premium_Upgrade`;

    const handleSubmitToken = async (e) => {
        e.preventDefault();
        if (utrNumber.length < 12) {
            toast.error('Please enter a valid 12-digit UTR / Reference Number.');
            return;
        }

        setSubmitting(true);
        // Simulate a network request for the UI flow
        setTimeout(() => {
            setSubmitting(false);
            toast.success('Payment details submitted! An Admin will verify and upgrade your account shortly.');
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 isolate overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 my-auto">

                {/* Header */}
                <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-6 text-center text-white relative flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl mx-auto flex items-center justify-center mb-3">
                        <Zap size={24} className="text-yellow-300" />
                    </div>
                    <h2 className="text-xl font-bold font-heading mb-1">Upgrade to Premium</h2>
                    <p className="opacity-90 max-w-sm mx-auto text-sm">Take full control of your career with advanced AI tools and unlimited access.</p>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <div className="flex items-end justify-center mb-6 gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">₹99</span>
                        <span className="text-gray-500 font-medium pb-1">/month</span>
                    </div>

                    <ul className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        {[
                            'Unlimited Resume Downloads',
                            'Unlimited AI Cover Letters',
                            'Full ATS Score Fixes & AI Breakdown',
                            'Premium Resume Templates',
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {/* QR Code Section */}
                    <div className="bg-white dark:bg-gray-800 border-2 border-primary-100 dark:border-primary-900/30 rounded-xl p-5 mb-6 shadow-sm">
                        <h3 className="text-center font-bold text-gray-900 dark:text-white mb-4">Scan & Pay via any UPI App</h3>
                        <div className="flex justify-center mb-4 bg-white p-2 rounded-lg inline-block mx-auto border border-gray-100">
                            <QRCodeSVG value={upiString} size={150} level="H" includeMargin={true} />
                        </div>
                        <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                            UPI ID: <span className="text-primary-600 font-bold select-all">{UPI_ID}</span>
                        </p>
                    </div>

                    {/* UTR Submission Form */}
                    <form onSubmit={handleSubmitToken} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Enter 12-Digit UTR / Reference No.
                            </label>
                            <input
                                type="text"
                                required
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                placeholder="e.g. 123456789012"
                                className="input w-full text-center tracking-widest font-mono"
                                maxLength={12}
                            />
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-center">
                                <ShieldCheck size={12} /> Found in your PhonePe / GPay transaction details
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full btn-primary text-base py-3 font-bold shadow-lg flex justify-center items-center gap-2"
                        >
                            {submitting ? 'Verifying...' : 'Submit Payment to Admin'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
