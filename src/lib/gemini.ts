import { GoogleGenAI } from '@google/genai';

/**
 * Socratic AI Tutor using Gemini API (@google/genai)
 * Model: gemini-3.6-flash
 */
export async function askSocraticTutor(
  studentQuestion: string,
  lessonContext?: string,
  chatHistory?: { question: string; answer: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Provide a helpful Socratic fallback response if API key is missing or placeholder
    return getFallbackSocraticResponse(studentQuestion, lessonContext);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `Bạn là Trợ lý AI Giảng dạy theo phương pháp Socratic (Socratic AI Tutor) dành cho học sinh.
Nhiệm vụ và Nguyên tắc cốt lõi của bạn:
1. KHÔNG BAO GIỜ cho đáp án trực tiếp hoặc giải hộ bài hoàn chỉnh.
2. CHỈ GỢI Ý TỪNG BƯỚC để hướng dẫn học sinh tự suy luận.
3. ĐẶT CÂU HỎI NGƯỢC LẠI để giúp học sinh nhận ra vấn đề.
4. GỢI Ý CÁC CÔNG THỨC, KHÁI NIỆM Hoặc ĐỊNH LÝ liên quan.
5. KIỂM TRA LỜI GIẢI của học sinh khi họ gửi câu trả lời (chỉ ra điểm đúng/chưa chính xác).
6. Dùng văn phong sư phạm, khuyến khích, tiếng Việt chuẩn mực.
7. TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ EMOJI HOẶC ICON NÀO trong câu trả lời.`;

    const historyPrompt = chatHistory && chatHistory.length > 0
      ? chatHistory.slice(-4).map(h => `Học sinh: ${h.question}\nAI: ${h.answer}`).join('\n\n')
      : '';

    const fullPrompt = `${lessonContext ? `[Bối cảnh bài học]: ${lessonContext}\n` : ''}
${historyPrompt ? `[Lịch sử trao đổi]:\n${historyPrompt}\n` : ''}
[Học sinh gửi]: ${studentQuestion}

Hãy đưa ra câu trả lời theo đúng phương pháp Socratic (gợi ý từng bước, câu hỏi gợi mở, công thức liên quan, không cho đáp án ngay, tuyệt đối không emoji/icon).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || 'Rất tiếc, AI chưa thể tạo phản hồi lúc này.';
  } catch (err) {
    console.error('Error calling Gemini API:', err);
    return getFallbackSocraticResponse(studentQuestion, lessonContext);
  }
}

function getFallbackSocraticResponse(question: string, lessonContext?: string): string {
  const qLower = question.toLowerCase();

  if (qLower.includes('phương trình') || qLower.includes('x') || qLower.includes('bậc hai')) {
    return `Để giải quyết bài toán này, chúng ta hãy đi từng bước một:

Bước 1: Em hãy xác định các hệ số a, b, c trong phương trình của mình.
Bước 2: Em có nhớ công thức tính Delta (Biệt thức Δ) không?
Gợi ý công thức: Δ = b² - 4ac

Em hãy thử tính giá trị Δ cho bài toán của mình và cho thầy/cô biết kết quả nhé?`;
  }

  if (qLower.includes('diện tích') || qLower.includes('chu vi') || qLower.includes('hình')) {
    return `Hãy xem xét lại hình dạng và dữ kiện đề bài cho:

Bước 1: Bài toán yêu cầu tính toán đại lượng nào (diện tích, chu vi hay thể tích)?
Bước 2: Em hãy nhắc lại công thức cơ bản liên quan đến hình này?
Gợi ý: Nếu là hình chữ nhật, S = a × b. Nếu là hình tròn, S = π × r².

Em đã có các số liệu đầu vào chưa và bước tiếp theo em sẽ thực hiện phép tính gì?`;
  }

  if (qLower.includes('đáp án') || qLower.includes('kết quả') || qLower.includes('giải hộ')) {
    return `Thầy/Cô và AI ở đây để hỗ trợ em tự tìm ra đáp án chứ không làm bài hộ em!

Hãy cho AI biết:
1. Em đã thực hiện được những bước nào rồi?
2. Em đang bị vướng ở bước tính toán hay công thức nào?

Hãy gửi phần em đã làm được để chúng ta cùng kiểm tra nhé!`;
  }

  return `Cảm ơn em đã đặt câu hỏi về bài học "${lessonContext || 'Bài học'}".

Để tự khám phá ra câu trả lời, em hãy trả lời thử 2 câu hỏi gợi mở này:
1. Khái niệm chính hoặc công thức quan trọng nhất trong bài học này là gì?
2. Em nghĩ bước đầu tiên cần làm đối với dạng bài này là gì?

Hãy chia sẻ suy nghĩ của em để chúng ta cùng phân tích từng bước!`;
}
