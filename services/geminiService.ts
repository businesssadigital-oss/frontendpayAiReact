import { MOCK_PRODUCTS } from "../constants";

// Lightweight fallback AI helper used during development and type-checking.
// This avoids requiring the external `@google/genai` package at build time.
export const getSmartResponse = async (userMessage: string): Promise<string> => {
  try {
    // Build a short context using product names and prices
    const productList = MOCK_PRODUCTS.map(p => `- ${p.name} ($${p.price})`).slice(0, 6).join('\n');

    // Simple heuristic-based response generator (not a real AI)
    const lower = userMessage.toLowerCase();
    if (/price|سعر|تكلفة/.test(lower)) {
      // find mentioned product
      for (const p of MOCK_PRODUCTS) {
        if (lower.includes(p.name.toLowerCase())) {
          return `سعر ${p.name} هو $${p.price}.`; 
        }
      }
      return `الأسعار المتاحة:\n${productList}`;
    }

    if (/how|كيف|استخدم|استعمال/.test(lower)) {
      return `لتفعيل الكود: افتح الموقع الرسمي للخدمة ثم أدخل الكود في حقل التفعيل واضغط "تفعيل".`;
    }

    // Default helpful reply
    return `مرحباً! إليك بعض المنتجات الشائعة:\n${productList}\nاسألني عن منتج معين لمعرفة المزيد.`;
  } catch (err) {
    console.error('Gemini fallback error:', err);
    return 'عذراً، لا أستطيع المعالجة الآن.';
  }
};
