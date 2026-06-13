const OpenAI = require('openai');
const logger = require('../utils/logger');

const generateDoctorContent = async (doctorDetails) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
    Create professional website content for a doctor.
    Name: ${doctorDetails.name}
    Qualification: ${doctorDetails.education}
    Speciality: ${doctorDetails.speciality}
    Clinic Name: ${doctorDetails.clinicName}
    Location: ${doctorDetails.location}
    Return ONLY a JSON object with this exact structure:
    {
      "about": "A professional, trustworthy 60-word bio.",
      "services": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5", "Service 6"],
      "tagline": "A short caring tagline (max 10 words)",
      "heroHeadline": "A warm premium homepage headline, 5 to 8 words, no doctor name."
    }
  `;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(aiResponse.choices[0].message.content);
  } catch (error) {
    logger.error("OpenAI Error:", error);
    return { 
      about: `Dr. ${doctorDetails.name} is a dedicated specialist in ${doctorDetails.speciality} providing top-notch care at ${doctorDetails.clinicName}.`, 
      services: ["Specialist Consultation", "Preventive Care", "Diagnosis and Evaluation", "Personalized Treatment", "Follow-up Care", "Health Guidance"],
      tagline: "Your Health, Our Priority.",
      heroHeadline: "Thoughtful care, centered on you."
    };
  }
};

module.exports = {
  generateDoctorContent
};
