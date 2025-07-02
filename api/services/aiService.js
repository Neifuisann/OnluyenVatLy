const fetch = require('node-fetch');
const { API_ENDPOINTS, APP_CONFIG } = require('../config/constants');

class AIService {
  constructor() {
    this.apiKey = APP_CONFIG.GEMINI_API_KEY;
    this.apiUrl = API_ENDPOINTS.GEMINI_URL;
  }

  // Format document content using AI
  async formatDocumentWithAI(text) {
    const prompt = `Bạn là một trợ lý AI chuyên định dạng nội dung bài học cho hệ thống giáo dục.

NHIỆM VỤ: Chuyển đổi văn bản sau thành định dạng bài học chuẩn với các câu hỏi trắc nghiệm.

YÊU CẦU ĐỊNH DẠNG:
1. Mỗi câu hỏi phải bắt đầu bằng "Câu X:" (X là số thứ tự)
2. Nếu câu hỏi có nhiều điểm, thêm "[X pts]" trên dòng mới sau câu hỏi
3. Với câu hỏi trắc nghiệm ABCD:
   - Mỗi lựa chọn trên một dòng riêng: A. [nội dung]
   - Đánh dấu đáp án đúng bằng dấu * ở đầu: *A. [đáp án đúng]
   - Luôn có đủ 4 lựa chọn A, B, C, D
4. Với câu hỏi Đúng/Sai nhiều ý:
   - Mỗi ý trên một dòng: a) [nội dung]
   - Đánh dấu ý đúng bằng dấu *: *a) [ý đúng]
5. Với câu hỏi điền số:
   - Viết "Answer: [số]" trên dòng mới sau câu hỏi
6. Giữa các câu hỏi cách nhau một dòng trống

QUY TẮC CHUYỂN ĐỔI:
- Nếu văn bản có sẵn câu hỏi, giữ nguyên và định dạng lại cho đúng chuẩn
- Nếu văn bản là bài giảng/lý thuyết, tạo 5-10 câu hỏi trắc nghiệm dựa trên nội dung
- Ưu tiên câu hỏi ABCD (70%), Đúng/Sai nhiều ý (20%), điền số (10%)
- Câu hỏi phải rõ ràng, súc tích, phù hợp với nội dung
- Các lựa chọn phải hợp lý, tránh quá dễ hoặc quá khó

VÍ DỤ OUTPUT:
Câu 1: Phương trình bậc hai ax² + bx + c = 0 có nghiệm khi nào?
A. Δ > 0
*B. Δ ≥ 0
C. Δ < 0
D. Δ ≤ 0

Câu 2: Các phát biểu sau về tam giác vuông, phát biểu nào đúng?
[2 pts]
*a) Tổng hai góc nhọn bằng 90°
b) Cạnh huyền là cạnh nhỏ nhất
*c) Định lý Pytago: a² + b² = c²
d) Có thể có hai góc vuông

Câu 3: Tính diện tích hình tròn có bán kính 5cm (lấy π = 3.14)
Answer: 78.5

VĂN BẢN CẦN CHUYỂN ĐỔI:
${text}

OUTPUT (chỉ trả về nội dung đã định dạng, không giải thích thêm):`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid AI response format:', data);
        throw new Error('Invalid AI response format');
      }

      let formattedContent = data.candidates[0].content.parts[0].text;

      // Clean up the response
      formattedContent = this.cleanupAIResponse(formattedContent);

      // Validate that we have at least one question
      if (!formattedContent.includes('Câu 1:')) {
        console.warn('AI response does not contain expected question format');
        throw new Error('AI không tạo được câu hỏi từ nội dung');
      }

      return formattedContent;

    } catch (error) {
      console.error('AI formatting error:', error);
      throw new Error('Không thể kết nối với AI để định dạng nội dung');
    }
  }

  // Clean up AI response
  cleanupAIResponse(content) {
    // Remove any markdown code blocks if present
    content = content.replace(/```[a-z]*\n/g, '');
    content = content.replace(/```/g, '');

    // Ensure proper line breaks
    content = content.replace(/\r\n/g, '\n');

    // Trim whitespace
    content = content.trim();

    return content;
  }

  // Generate lesson summary using AI
  async generateLessonSummary(lessonContent) {
    const prompt = `Tạo tóm tắt ngắn gọn (2-3 câu) cho bài học sau:

${lessonContent}

Tóm tắt phải:
- Ngắn gọn, súc tích
- Nêu được nội dung chính
- Phù hợp với học sinh`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 200
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid AI response format');
      }

      return this.cleanupAIResponse(data.candidates[0].content.parts[0].text);

    } catch (error) {
      console.error('Error generating lesson summary:', error);
      throw new Error('Không thể tạo tóm tắt bài học');
    }
  }

  // Generate question explanations using AI
  async generateQuestionExplanation(question, correctAnswer, studentAnswer) {
    const prompt = `Giải thích tại sao đáp án đúng cho câu hỏi sau:

Câu hỏi: ${question}
Đáp án đúng: ${correctAnswer}
Đáp án học sinh chọn: ${studentAnswer}

Yêu cầu:
- Giải thích ngắn gọn, dễ hiểu
- Nêu rõ tại sao đáp án đúng là chính xác
- Nếu học sinh chọn sai, giải thích tại sao đáp án đó không đúng
- Tối đa 2-3 câu`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid AI response format');
      }

      return this.cleanupAIResponse(data.candidates[0].content.parts[0].text);

    } catch (error) {
      console.error('Error generating question explanation:', error);
      throw new Error('Không thể tạo giải thích câu hỏi');
    }
  }

  // Validate AI service configuration
  validateConfiguration() {
    const errors = [];

    if (!this.apiKey) {
      errors.push('GEMINI_API_KEY is not configured');
    }

    if (!this.apiUrl) {
      errors.push('Gemini API URL is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Test AI service connectivity
  async testConnection() {
    try {
      const testPrompt = "Trả lời: OK";
      
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format');
      }

      return {
        success: true,
        message: 'AI service is working correctly'
      };

    } catch (error) {
      return {
        success: false,
        message: `AI service test failed: ${error.message}`
      };
    }
  }
}

module.exports = new AIService();
