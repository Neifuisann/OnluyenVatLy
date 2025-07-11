const fetch = require('node-fetch');
const { API_ENDPOINTS, APP_CONFIG } = require('../../config/constants');
const aiCacheService = require('../cache/aiCacheService');
const { sanitizeInput } = require('../../utils/sanitization');

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
2. Với câu hỏi trắc nghiệm ABCD:
   - Mỗi lựa chọn trên một dòng riêng: A. [nội dung]
   - Đánh dấu đáp án đúng bằng dấu * ở đầu: *A. [đáp án đúng]
   - Luôn có đủ 4 lựa chọn A, B, C, D
3. Với câu hỏi Đúng/Sai nhiều ý:
   - Mỗi ý trên một dòng: a) [nội dung]
   - Đánh dấu ý đúng bằng dấu *: *a) [ý đúng]
4. Với câu hỏi điền số:
   - Viết "Answer: [số]" trên dòng mới sau câu hỏi
5. Giữa các câu hỏi cách nhau một dòng trống

QUY TẮC CHUYỂN ĐỔI:
- Nếu văn bản có sẵn câu hỏi, TUYỆT ĐỐI GIỮ NGUYÊN và định dạng lại cho đúng chuẩn. Không được phép thay đổi câu hỏi và lựa chọn bằng bất kì lí do nào. Đảm bảo chuyển đổi TẤT CẢ các câu.
- Nếu văn bản là bài giảng/lý thuyết, tạo 5-10 câu hỏi trắc nghiệm dựa trên nội dung. Ưu tiên câu hỏi ABCD (6 câu), Đúng/Sai nhiều ý (2 câu tổng 8 ý), điền số (3 câu). Câu hỏi phải rõ ràng, súc tích, phù hợp với nội dung. Các lựa chọn phải hợp lý, độ khó tùy vào kiến thức gốc.
- Sử dụng latex đối với các phương trình trong cặp dấu $inline-latex$

VÍ DỤ OUTPUT:
Câu 1: Phương trình bậc hai $ax² + bx + c = 0$ có nghiệm khi nào?
A. $Δ > 0$
*B. $Δ ≥ 0$
C. $Δ < 0$
D. $Δ ≤ 0$

Câu 2: Các phát biểu sau về tam giác vuông, phát biểu nào đúng?
*a) Tổng hai góc nhọn bằng 90°
b) Cạnh huyền là cạnh nhỏ nhất
*c) Định lý Pytago: $a² + b² = c²$
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
            thinkingConfig: {
              thinkingBudget: 6000,
            },
            maxOutputTokens: 30000
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

    // Remove existing point markings to prevent duplication
    // This handles cases where AI content might already have point markings
    content = content.replace(/\s*\[\s*[\d.]+\s*pts?\s*\]/gi, '').replace(/\s+/g, ' ');

    // Ensure proper line breaks
    content = content.replace(/\r\n/g, '\n');

    // Trim whitespace
    content = content.trim();

    return content;
  }

  // Enhanced lesson summary generation with better context understanding
  async generateLessonSummary(lessonData) {
    // Check cache first
    const cachedResult = await aiCacheService.get('summary', lessonData);
    if (cachedResult) {
      console.log('Using cached lesson summary');
      return cachedResult.summary || cachedResult;
    }

    // Extract lesson context from various sources
    let lessonContext = '';
    
    if (typeof lessonData === 'string') {
      // Legacy support: if just a string is passed
      lessonContext = lessonData;
    } else {
      // Build comprehensive context from lesson data with sanitization
      const { title, questions, grade, subject, tags } = lessonData;
      
      lessonContext = `Tiêu đề bài học: ${sanitizeInput(title) || 'Không có tiêu đề'}\n`;
      lessonContext += `Môn học: ${sanitizeInput(subject) || 'Vật lý'}\n`;
      lessonContext += `Lớp: ${sanitizeInput(grade) || 'Không xác định'}\n`;
      if (tags && tags.length > 0) {
        lessonContext += `Chủ đề: ${tags.join(', ')}\n`;
      }
      lessonContext += '\nNội dung câu hỏi:\n';
      
      // Extract key concepts from questions
      if (questions && Array.isArray(questions)) {
        questions.forEach((q, index) => {
          if (q.question) {
            lessonContext += `${index + 1}. ${q.question}\n`;
          }
        });
      }
    }

    const prompt = `Bạn là giáo viên vật lý giàu kinh nghiệm. Hãy tạo mô tả ngắn gọn và hấp dẫn cho bài học sau:

${lessonContext}

YÊU CẦU:
- Mô tả phải dài 3-4 câu, súc tích nhưng đầy đủ thông tin
- Nêu rõ kiến thức chính học sinh sẽ học được
- Có thể đề cập đến ứng dụng thực tế nếu phù hợp
- Viết theo phong cách mô tả trực tiếp
- Phải liên quan trực tiếp đến nội dung bài học này.

VÍ DỤ MẪU:
- "Khám phá nguyên lý hoạt động của đòn bẩy và ròng rọc trong cuộc sống hàng ngày. Học cách tính toán lực và khoảng cách để nâng vật nặng dễ dàng hơn."
- "Tìm hiểu về chuyển động thẳng đều và các công thức tính vận tốc, quãng đường. Áp dụng kiến thức để giải quyết các bài toán thực tế về giao thông."

MÔ TẢ (chỉ trả về mô tả, không giải thích thêm):`;

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
            temperature: 0.7, // Higher for more creative summaries
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 8000
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

      const summary = this.cleanupAIResponse(data.candidates[0].content.parts[0].text);
      
      // Validate summary quality
      if (summary.length < 50 || summary.length > 500) {
        throw new Error('Generated summary does not meet length requirements');
      }
      
      // Cache the result
      await aiCacheService.set('summary', lessonData, summary, 3600); // Cache for 1 hour
      
      return summary;

    } catch (error) {
      console.error('Error generating lesson summary:', error);
      // Return a fallback summary if AI fails
      const fallbackSubject = lessonData.subject || 'Vật lý';
      const fallbackGrade = lessonData.grade || '';
      return `Bài học ${fallbackSubject} ${fallbackGrade} với các câu hỏi trắc nghiệm và bài tập thực hành. Phù hợp cho học sinh muốn ôn tập và nâng cao kiến thức.`;
    }
  }

  // Generate image prompt for lesson visualization
  async generateImagePrompt() {
    const prompt = `Tạo một mô tả hình ảnh (prompt) 
- Phải là tiếng Anh, ngắn gọn (tối đa 50 từ)
- Mô tả một hình ảnh ngẫu nhiên nhưng tuyệt đối không có con người.
- Prompt tuân theo cấu trúc sau:{description} = {focusDetailed},%20{adjective1},%20{adjective2},%20{visualStyle1},%20{visualStyle2},%20{visualStyle3},%20{artistReference}
Ví dụ: A photo of a cat on a couch, comfortable, cute, colourful, interior design, Ansel Adams.
Ví dụ: A fox wearing a cloak, cinematic, heroic, professional photography, 4k, photo realistic, Tim Burton.

PROMPT TIẾNG ANH (chỉ trả về prompt, không giải thích):`;

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
            temperature: 2,
            topK: 300,
            topP: 0.9,
            maxOutputTokens: 8000
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

      const imagePrompt = this.cleanupAIResponse(data.candidates[0].content.parts[0].text);
      
      // Add standard suffix for consistency
      const enhancedPrompt = `${imagePrompt}`;
      
      return enhancedPrompt;

    } catch (error) {
      console.error('Error generating image prompt:', error);
      // Return a fallback prompt
      return 'A vast, starry night sky above mountains.';
    }
  }

  // Sanitize and translate user-defined image prompt
  async sanitizeImagePrompt(userPrompt) {
    if (!userPrompt || userPrompt.trim() === '') {
      throw new Error('User prompt is empty');
    }

    const prompt = `Bạn là một trợ lý AI chuyên xử lý mô tả hình ảnh.

NHIỆM VỤ: Xử lý mô tả hình ảnh do người dùng nhập vào để tạo prompt phù hợp cho AI tạo ảnh.

YÊU CẦU XỬ LÝ:
1. Kiểm tra và loại bỏ nội dung không phù hợp (bạo lực, khiêu dâm, chính trị nhạy cảm)
2. Dịch sang tiếng Anh
3. Tối ưu hóa cho AI tạo ảnh (rõ ràng, cụ thể, mô tả thị giác)
4. Loại bỏ yêu cầu về con người cụ thể hoặc nhân vật có thật
5. Giới hạn trong 50 từ

QUY TẮC:
- Nếu nội dung không phù hợp: trả về "INAPPROPRIATE_CONTENT"
- Nếu phù hợp: trả về prompt tiếng Anh đã tối ưu
- Chỉ trả về kết quả, không giải thích

INPUT = {focus}
OUTPUT = {description} 
{description} = {focusDetailed},%20{adjective1},%20{adjective2},%20{visualStyle1},%20{visualStyle2},%20{visualStyle3},%20{artistReference}

INPUT = a photo of a cat
OUTPUT = A photo of a cat on a couch, comfortable, cute, colourful, interior design, Ansel Adams

INPUT = Fox with a cloak
OUTPUT = A fox wearing a cloak, cinematic, heroic, professional photography, 4k, photo realistic, Tim Burton

INPUT: "${sanitizeInput(userPrompt)}"
OUTPUT:`;

    try {
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent results
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 8000
        }
      };

      console.log('Sending request to Gemini API for prompt sanitization...');
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error ${response.status}:`, errorText);
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      console.log('Gemini API response:', JSON.stringify(data, null, 2));

      // Handle different possible response formats
      let responseText = '';

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = data.candidates[0].content.parts[0].text;
      } else if (data.candidates?.[0]?.output) {
        responseText = data.candidates[0].output;
      } else if (data.text) {
        responseText = data.text;
      } else if (data.response) {
        responseText = data.response;
      } else {
        console.error('Unexpected Gemini API response format:', data);
        throw new Error('Invalid AI response format - no text content found');
      }

      const sanitizedPrompt = this.cleanupAIResponse(responseText);

      // Check if content was deemed inappropriate
      if (sanitizedPrompt.includes('INAPPROPRIATE_CONTENT')) {
        throw new Error('Nội dung không phù hợp với môi trường giáo dục');
      }

      return sanitizedPrompt;

    } catch (error) {
      console.error('Error sanitizing image prompt:', error);

      // Fallback: basic sanitization without AI
      console.log('Falling back to basic sanitization...');

      // Basic inappropriate content filtering
      const inappropriateWords = ['sex', 'nude', 'naked', 'porn', 'violence', 'kill', 'death', 'blood'];
      const lowerPrompt = userPrompt.toLowerCase();

      for (const word of inappropriateWords) {
        if (lowerPrompt.includes(word)) {
          throw new Error('Nội dung không phù hợp với môi trường giáo dục');
        }
      }

      // Basic cleanup and return original prompt if it seems safe
      const cleanPrompt = userPrompt
        .replace(/[^\w\s,.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);

      return cleanPrompt || 'A beautiful educational illustration';
    }
  }

  // Generate question explanations using AI
  async generateQuestionExplanation(question, correctAnswer, studentAnswer) {
    // Create cache key from question parameters
    const explanationData = { question, correctAnswer, studentAnswer };
    const cachedResult = await aiCacheService.get('explanation', explanationData);
    if (cachedResult) {
      console.log('Using cached question explanation');
      return cachedResult.explanation || cachedResult;
    }

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
            maxOutputTokens: 8000
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

      const explanation = this.cleanupAIResponse(data.candidates[0].content.parts[0].text);
      
      // Cache the result
      await aiCacheService.set('explanation', explanationData, explanation, 1800); // Cache for 30 minutes
      
      return explanation;

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
            maxOutputTokens: 8000
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