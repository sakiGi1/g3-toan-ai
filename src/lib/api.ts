/**
 * Helper to execute fetch and parse JSON safely.
 * Throws clean, descriptive error messages if the response is HTML (e.g. 404/500 from Vercel) or invalid JSON.
 */
export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    const rawText = await res.text();
    if (rawText.startsWith('<!DOCTYPE') || rawText.includes('<html') || rawText.startsWith('The page')) {
      throw new Error(
        `Không thể đọc dữ liệu API (Mã lỗi ${res.status}). Server Vercel/Backend trả về trang HTML thay vì JSON. Vui lòng kiểm tra Vercel API rewrite.`
      );
    }
    throw new Error(`Định dạng phản hồi không hợp lệ (${res.status}): ${rawText.slice(0, 100)}`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `Lỗi HTTP ${res.status}`);
  }

  return data as T;
}
