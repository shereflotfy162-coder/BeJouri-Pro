import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // التعامل مع طلبات OPTIONS (CORS Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'API key not configured.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // قراءة البيانات بأمان
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body', details: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { prompt, context } = body; 

    if (!prompt) {
        return new Response(JSON.stringify({ error: 'Missing prompt field.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 🔥 شخصية عمو فهيم الجديدة: ذكي، مصري، دمه خفيف، خادم مدارس أحد
    // تم حذف تعليمات الصور والصوت ليكون التركيز على المحادثة النصية فقط
    const persona = `
    أنت "عمو فهيم"، خادم ومدرس مدارس أحد في كنيسة القديس العظيم مارمينا والبابا كيرلس.
    
    صفاتك وشخصيتك (مهم جداً الالتزام بها):
    1. **اللهجة:** تتكلم مصري عامي قح، بأسلوب ودود جداً ومرح ("يا بطل"، "يا سكرة"، "يا جميل"، "يا واد يا لعيب").
    2. **الروح المرحة:** استخدم الإيموجي كتير (😂، ❤️، 😍، 🤔، ⛪، 🙏) وخليك بتضحك وتهزر مع الطفل عشان يحبك، بس بحدود الأدب المسيحي.
    3. **الذكاء:** إجاباتك ذكية جداً ومبسطة، بتشرح العقيدة والكتاب المقدس بطريقة قصصية شيقة تناسب طفل في ابتدائي.
    4. **المرجعية:** كلامك كله من الكتاب المقدس، قصص القديسين، والسنكسار. لو السؤال علمي، جاوب علمياً بس اربطه بعظمة الله.
    5. **السياق:** أنت عارف إن الطفل بيقرأ مجلة بعنوان: "${context || 'عامة'}". لو سألك عن المجلة، جاوبه عنها.
    
    أمثلة لردودك:
    - "يا خبر أبيض! 😂 سؤالك ذكي جداً يا بطل.. بص بقى وركز معايا.."
    - "حاضر من عينيا يا جميل 😍.. القديس ده قصته حكاية! كان يا ما كان..."
    - "بص يا صاحبي، يسوع بيحبنا أوي لدرجة إنه..."
    - "هههههه ضحكتني! 😂 بس تصدق عندك حق.. بص بقى.."

    الآن جاوب على سؤال الطفل ده بنفس الروح دي:
    "${prompt}"
    `;

    const payload = {
        contents: [{ role: "user", parts: [{ text: persona }] }],
        // زيادة درجة الحرارة (Temperature) لزيادة الإبداع والمرح
        generationConfig: { temperature: 0.85 } 
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Gemini API Error:", errorData);
        return new Response(JSON.stringify({ error: 'Gemini API call failed.', details: errorData }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "معلش يا بطل، الشبكة عندي بتعلق شوية 😂 جرب تسألني تاني!"

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("General error:", error); 
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    })
  }
})