/**
 * OpenAI API Socratic Assistant Integration Utility
 */

export interface SocraticPromptOptions {
  question: string;
  lessonTitle?: string;
  chatHistory?: { question: string; answer: string }[];
}

export async function askOpenAISocraticTutor(options: SocraticPromptOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // If OpenAI API Key is not set, delegate to Socratic fallback engine
    return `[Socratic Guide]
1. Hãy xác định giả thiết và kết luận của bài toán.
2. Công thức cốt lõi cần sử dụng là gì?
3. Thử áp dụng bước đầu tiên và gửi kết quả cho AI kiểm tra!`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là Trợ lý AI Giảng dạy Socratic. Không bao giờ cho đáp án trực tiếp.
Chỉ gợi ý từng bước, đặt câu hỏi ngược, nhắc công thức liên quan, kiểm tra lời giải.
Tuyệt đối không dùng emoji hoặc icon.`,
          },
          {
            role: 'user',
            content: `Bài học: ${options.lessonTitle || 'Tổng quát'}\nCâu hỏi: ${options.question}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Không thể nhận phản hồi từ OpenAI.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return 'Lỗi kết nối OpenAI API.';
  }
}
