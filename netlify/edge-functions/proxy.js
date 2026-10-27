export default async (request, context) => {
  const url = new URL(request.url);
  
  // إذا لم يكن المسار /proxy، نمرر الطلب كالمعتاد
  if (!url.pathname.startsWith('/proxy')) {
    return context.next();
  }

  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  const s = url.searchParams.get("s") || 1;
  const e = url.searchParams.get("e") || 1;

  if (!id || !type) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let m3u8 = null;

  // 1. VidLink.pro
  try {
    const embedUrl = type === 'movie'
      ? `https://vidlink.pro/movie/${id}`
      : `https://vidlink.pro/tv/${id}/${s}/${e}`;
    
    const res = await fetch(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    
    // البحث عن رابط m3u8
    const match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/);
    if (match) {
      m3u8 = match[1];
    }
  } catch (err) {
    console.error('VidLink error:', err.message);
  }

  // 2. Vidsrc.icu (احتياطي)
  if (!m3u8) {
    try {
      const embedUrl = type === 'movie'
        ? `https://vidsrc.icu/embed/movie/${id}`
        : `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`;
      
      const res = await fetch(embedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      
      const match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/);
      if (match) {
        m3u8 = match[1];
      }
    } catch (err) {
      console.error('Vidsrc error:', err.message);
    }
  }

  // إرجاع النتيجة
  if (m3u8) {
    return new Response(JSON.stringify({ m3u8 }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  return new Response(JSON.stringify({ error: "No streams found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
};

// نجعله يعمل فقط على مسار /proxy لتجنب تعارض مع باقي الموقع
export const config = { path: "/proxy" };