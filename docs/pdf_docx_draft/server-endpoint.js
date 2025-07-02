// Add this endpoint to your server.js file after the existing upload endpoints

// Document processing endpoint
app.post('/api/admin/process-document', requireAuth, upload.single('document'), async (req, res) => {
    console.log('Received document processing request');
    
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không có file nào được tải lên' 
            });
        }
        
        const file = req.file;
        console.log('Processing file:', file.originalname, 'Type:', file.mimetype, 'Size:', file.size);
        
        // Validate file type
        const allowedMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Chỉ hỗ trợ file PDF và DOCX' 
            });
        }
        
        let extractedText = '';
        
        // Extract text based on file type
        if (file.mimetype === 'application/pdf') {
            // Extract text from PDF
            console.log('Extracting text from PDF...');
            const pdfParse = require('pdf-parse');
            
            try {
                const pdfData = await pdfParse(file.buffer);
                extractedText = pdfData.text;
                console.log(`Extracted ${extractedText.length} characters from PDF`);
            } catch (pdfError) {
                console.error('PDF extraction error:', pdfError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Không thể đọc file PDF. Vui lòng kiểm tra file không bị hỏng.' 
                });
            }
            
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Extract text from DOCX
            console.log('Extracting text from DOCX...');
            const mammoth = require('mammoth');
            
            try {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                extractedText = result.value;
                console.log(`Extracted ${extractedText.length} characters from DOCX`);
                
                if (result.messages && result.messages.length > 0) {
                    console.warn('Mammoth warnings:', result.messages);
                }
            } catch (docxError) {
                console.error('DOCX extraction error:', docxError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Không thể đọc file DOCX. Vui lòng kiểm tra file không bị hỏng.' 
                });
            }
        }
        
        // Check if text was extracted
        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể trích xuất nội dung từ file. File có thể trống hoặc chỉ chứa hình ảnh.' 
            });
        }
        
        // Limit text length for AI processing (to avoid token limits)
        const maxTextLength = 50000; // ~12,500 tokens
        if (extractedText.length > maxTextLength) {
            console.log(`Text too long (${extractedText.length} chars), truncating to ${maxTextLength} chars`);
            extractedText = extractedText.substring(0, maxTextLength);
        }
        
        // Send to AI for formatting
        console.log('Sending to AI for formatting...');
        const formattedContent = await formatDocumentWithAI(extractedText);
        
        if (!formattedContent) {
            throw new Error('AI không thể định dạng nội dung');
        }
        
        console.log('Document processing completed successfully');
        
        // Return formatted content
        res.json({
            success: true,
            formattedContent: formattedContent,
            originalFileName: file.originalname,
            extractedLength: extractedText.length
        });
        
    } catch (error) {
        console.error('Document processing error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Lỗi xử lý tài liệu' 
        });
    }
});

// Helper function to format document with AI
async function formatDocumentWithAI(text) {
    const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAxJF-5iBBx7gp9RPwrAfF58ERZi69KzCc";
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
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
        const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
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
        formattedContent = formattedContent.trim();
        
        // Remove any markdown code blocks if present
        formattedContent = formattedContent.replace(/```[a-z]*\n/g, '');
        formattedContent = formattedContent.replace(/```/g, '');
        
        // Ensure proper line breaks
        formattedContent = formattedContent.replace(/\r\n/g, '\n');
        
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