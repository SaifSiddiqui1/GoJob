import React, { useState } from 'react';
import { X, CheckCircle, Zap } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PremiumModal({ isOpen, onClose }) {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // 1. Load Razorpay script
            const res = await loadRazorpayScript();
            if (!res) {
                toast.error('Razorpay SDK failed to load. Check your connection.');
                setLoading(false);
                return;
            }

            // 2. Fetch Razorpay key securely
            const keyRes = await paymentAPI.getKey();
            const rzpKey = keyRes.data?.keyId;
            if (!rzpKey) throw new Error('Could not fetch Payment Gateway Key');

            // 3. Create Order on Backend
            const orderRes = await paymentAPI.createOrder();
            if (!orderRes.success) throw new Error(orderRes.message || 'Failed to initialize payment.');

            const options = {
                key: rzpKey,
                amount: orderRes.amount,
                currency: orderRes.currency,
                name: 'GoJob Premium',
                description: 'Unlock Unlimited ATS Checks & Resumes',
                image: '/logo.png', // Or another icon
                order_id: orderRes.orderId,
                handler: async function (response) {
                    // 4. Verify Payment on Backend
                    try {
                        const verifyRes = await paymentAPI.verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes.success) {
                            toast.success('🎉 Welcome to Premium!');
                            updateUser(verifyRes.user); // Instantly update frontend state
                            onClose();
                        } else {
                            toast.error(verifyRes.message || 'Verification failed!');
                        }
                    } catch (err) {
                        toast.error('Payment verified, but server validation failed.');
                        console.error(err);
                    }
                },
                prefill: {
                    name: user?.fullName || '',
                    email: user?.email || '',
                    contact: user?.contactNumber || '',
                },
                theme: {
                    color: '#2563EB', // Tailwind Primary-600
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment Failed: ' + response.error.description);
            });
            rzp.open();

        } catch (err) {
            console.error('Upgrade Error:', err);
            toast.error(err.message || 'An error occurred during checkout.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 isolate">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 text-center text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <Zap size={32} className="text-yellow-300" />
                    </div>
                    <h2 className="text-2xl font-bold font-heading mb-2">Upgrade to Premium</h2>
                    <p className="opacity-90 max-w-sm mx-auto">Take full control of your career with advanced AI tools and unlimited access.</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="flex items-end justify-center mb-8 gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">₹99</span>
                        <span className="text-gray-500 font-medium pb-1">/month</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {[
                            'Unlimited Resume Downloads',
                            'Unlimited AI Cover Letters',
                            'Full ATS Score Fixes & AI Breakdown',
                            'Priority Job Alerts',
                            'Premium Resume Templates',
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full btn-primary text-base py-3 font-bold shadow-lg shadow-primary-500/30 flex justify-center items-center gap-2"
                    >
                        {loading ? 'Opening Checkout...' : 'Upgrade Now via Razorpay'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">Safe and secure payments powered by Razorpay. Cancel anytime.</p>
                </div>
            </div>
        </div>
    );
}
