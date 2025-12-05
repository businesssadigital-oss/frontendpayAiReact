import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface ChargilyPaymentProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: string) => void;
}

export const ChargilyPayment: React.FC<ChargilyPaymentProps> = ({ amount, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Check for payment callback from URL parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment_status');

    if (status === 'success') {
      setPaymentStatus('success');
      setStatusMessage('✅ تم الدفع بنجاح عبر Chargily Pay!');
      onSuccess({ 
        paymentMethod: 'chargily',
        amount,
        status: 'completed',
        timestamp: new Date().toISOString()
      });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'failed') {
      setPaymentStatus('error');
      setStatusMessage('❌ فشل الدفع. حاول مرة أخرى.');
      onError('فشل الدفع عبر Chargily Pay');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [amount, onSuccess, onError]);

  const handleChargilyPayment = async () => {
    setIsLoading(true);
    setPaymentStatus('pending');
    setStatusMessage('جاري معالجة طلب الدفع...');

    try {
      const currentUrl = window.location.origin;
      
      // Call backend to create Chargily checkout session
      const response = await fetch('https://backendpay-1.onrender.com/api/chargily/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          success_url: `${currentUrl}/?payment_status=success`,
          failure_url: `${currentUrl}/?payment_status=failed`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.checkout_url) {
        setCheckoutUrl(data.checkout_url);
        setStatusMessage('إعادة التوجيه إلى صفحة الدفع الآمنة...');
        
        // Redirect to Chargily payment page
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 1000);
      } else {
        throw new Error('لم يتم الحصول على رابط الدفع');
      }

    } catch (error) {
      setIsLoading(false);
      setPaymentStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'خطأ في معالجة الدفع';
      setStatusMessage(`❌ ${errorMessage}`);
      onError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Payment Amount Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
        <p className="text-sm text-gray-600 mb-1">المبلغ المستحق:</p>
        <p className="text-2xl font-bold text-blue-600">
          ${amount.toFixed(2)} <span className="text-sm">USD</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          ≈ {Math.round(amount * 200)} دج
        </p>
      </div>

      {/* Status Messages */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">{statusMessage}</p>
            <p className="text-green-700 text-sm mt-1">سيتم توجيهك قريباً إلى صفحة التأكيد</p>
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">{statusMessage}</p>
            <p className="text-red-700 text-sm mt-1">يرجى المحاولة مرة أخرى أو اختيار طريقة دفع أخرى</p>
          </div>
        </div>
      )}

      {paymentStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          <div>
            <p className="text-blue-800 font-medium">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Payment Button */}
      {paymentStatus === 'idle' && (
        <button
          onClick={handleChargilyPayment}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              جاري المعالجة...
            </>
          ) : (
            <>
              <span>🔐</span>
              الدفع عبر Chargily Pay
            </>
          )}
        </button>
      )}

      {/* Info Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <p className="text-xs text-gray-600">
          💳 <strong>Chargily Pay</strong> هي منصة دفع جزائرية آمنة تدعم:
        </p>
        <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4">
          <li>✓ البطاقات الائتمانية الجزائرية</li>
          <li>✓ البطاقة الذهبية</li>
          <li>✓ CIB والبنوك المحلية</li>
        </ul>
      </div>

      {/* Security Badge */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>🔒 دفع آمن و محمي</span>
      </div>
    </div>
  );
};
