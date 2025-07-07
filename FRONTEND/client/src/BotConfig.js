// src/BotConfig.js

const botFlow = {
  start: {
    message: 'Hello! How can I help you today?', // Thông điệp chào mừng
    trigger: 'chooseQuestion', // Khi người dùng trả lời, chatbot chuyển sang "chooseQuestion"
  },
  chooseQuestion: {
    message: 'Please select an option:', // Câu hỏi cho người dùng chọn
    options: [
      {
        text: 'What is your website about?', // Lựa chọn câu hỏi 1
        trigger: 'websiteInfo', // Chuyển sang bước "websiteInfo" khi chọn
      },
      {
        text: 'How can I contact you?', // Lựa chọn câu hỏi 2
        trigger: 'contactInfo', // Chuyển sang bước "contactInfo" khi chọn
      },
      {
        text: 'What services do you offer?', // Lựa chọn câu hỏi 3
        trigger: 'servicesInfo', // Chuyển sang bước "servicesInfo" khi chọn
      },
    ],
  },
  websiteInfo: {
    message:
      'We are a TOEIC test preparation platform. We help you practice and prepare for the TOEIC exam.',
    trigger: 'askMore', // Sau khi trả lời, chuyển sang bước "askMore"
  },
  contactInfo: {
    message: 'You can contact us via email at support@example.com.',
    trigger: 'askMore', // Sau khi trả lời, chuyển sang bước "askMore"
  },
  servicesInfo: {
    message: 'We offer practice tests, study materials, and personalized tutoring services.',
    trigger: 'askMore', // Sau khi trả lời, chuyển sang bước "askMore"
  },
  askMore: {
    message: 'Is there anything else I can help you with?',
    options: [
      {
        text: 'Yes, I have another question.', // Câu hỏi 1 sau khi trả lời
        trigger: 'chooseQuestion', // Trở lại bước "chooseQuestion" để chọn câu hỏi khác
      },
      {
        text: "No, that's all for now.", // Câu hỏi 2 để kết thúc
        trigger: 'endChat', // Kết thúc trò chuyện và chuyển sang "endChat"
      },
    ],
  },
  endChat: {
    message: 'Thank you for visiting! Have a great day!', // Thông điệp kết thúc
    trigger: 'start', // Quay lại bước "start" ban đầu
  },
};

export default botFlow;
