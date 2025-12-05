
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../services/db';

interface PayPalPaymentProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

export const PayPalPayment: React.FC<PayPalPaymentProps> = ({ amount, onSuccess, onError }) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const CLIENT_ID = 'Absv_t95cAwIPrRve1yzNnQvGEww5CzjwjG87nCV6bJGs05qdEjrGsF-AVgPJzMaS-R_YuXTk25tJoAu';

  useEffect(() => {
    const loadPayPalScript = async () => {
      if (window.paypal) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => onError('فشل تحميل PayPal SDK');
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, [CLIENT_ID, onError]);

  useEffect(() => {
    if (isLoaded && window.paypal && paypalRef.current) {
        // Clear any existing buttons
        paypalRef.current.innerHTML = '';

        window.paypal.Buttons({
            createOrder: async (data: any, actions: any) => {
                try {
                    console.log('📤 Creating PayPal order for amount:', amount);
                    // Call backend to create order
                    const orderData = await db.createPayPalOrder(amount);
                    console.log('✅ Order created:', orderData.id);
                    return orderData.id;
                } catch (error: any) {
                    console.error('❌ PayPal create error:', error);
                    onError(`فشل إنشاء الطلب: ${error.message}`);
                    throw error;
                }
            },
            onApprove: async (data: any, actions: any) => {
                try {
                    console.log('✓ Order approved, capturing:', data.orderID);
                    // Capture order via backend
                    const details = await db.capturePayPalOrder(data.orderID);
                    console.log('✅ Capture response:', details);
                    
                    if (details.status === 'COMPLETED' || details.payer) {
                         onSuccess(details);
                    } else {
                        onError('لم تكتمل عملية الدفع');
                    }
                } catch (error: any) {
                    console.error('❌ Capture error:', error);
                    onError(`فشل تأكيد الطلب: ${error.message}`);
                }
            },
            onError: (err: any) => {
                console.error('❌ PayPal Error:', err);
                onError(`خطأ PayPal: ${err.message || 'حدث خطأ غير متوقع'}`);
            }
        }).render(paypalRef.current);
    }
  }, [isLoaded, amount, onSuccess, onError]);

  if (!db.isConnected()) {
      return (
          <div className="text-center p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
              <p className="font-bold">تنبيه</p>
              <p className="text-sm">يجب تشغيل الخادم (Server) لاستخدام PayPal بشكل آمن.</p>
          </div>
      );
  }

  return (
    <div className="w-full">
      {!isLoaded && <div className="text-center py-4">جاري تحميل PayPal...</div>}
      <div ref={paypalRef} className="z-0 relative" />
    </div>
  );
};
