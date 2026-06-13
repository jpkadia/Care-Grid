const OpenAI = require('openai');
const logger = require('../utils/logger');

const answerFromAdminData = async ({ role, message, history = [], context }) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = `
You are a data-grounded assistant inside a healthcare website admin panel.
The user role is: ${role}.
Answer only from the ADMIN_DATA JSON supplied below.
Never invent records, counts, dates, patient details, or operational facts.
If ADMIN_DATA does not contain the answer, clearly say that the requested information is not available in the admin panel data.
Do not provide medical diagnosis or treatment advice.
Keep answers concise and useful. Use the same language as the user's question when practical.

ADMIN_DATA:
${JSON.stringify(context)}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10),
        { role: 'user', content: message }
      ],
      temperature: 0
    });
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Admin chatbot OpenAI error', { message: error.message });
    const serviceError = new Error('Chat assistant is temporarily unavailable. Please try again.');
    serviceError.statusCode = 503;
    throw serviceError;
  }
};

module.exports = { answerFromAdminData };
