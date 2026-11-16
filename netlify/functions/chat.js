
exports.handler = async (event) => {
  const respond = (reply) => ({
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify({ reply })
  });

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "POST request required" })
    };
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return respond("Netlify मध्ये GROQ_API_KEY सेट केलेली नाही.");
    }

    const body = JSON.parse(event.body || "{}");

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const chatMessages = messages
      .filter(message =>
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      )
      .slice(-16);

    if (!chatMessages.length) {
      return respond("कृपया मला प्रश्न विचारा.");
    }

    const apiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: `तुझे नाव सौरभ भैया AI आहे.

तू एक Advanced Marathi AI Assistant आहेस.

तुझी वैशिष्ट्ये:
- सोप्या मराठीत संवाद साध.
- वापरकर्त्याचा प्रश्न पूर्ण समजून घे.
- अचूक आणि उपयुक्त उत्तरे दे.
- एकच शब्द किंवा वाक्य वारंवार वापरू नकोस.
- प्रत्येक प्रश्नाला संदर्भानुसार नवीन उत्तर दे.
- आधीच्या संभाषणाचा संदर्भ लक्षात ठेव.
- अनावश्यक लांब उत्तरे देऊ नकोस.
- माहिती माहीत नसेल तर स्पष्ट सांग.
- तांत्रिक मार्गदर्शन क्रमाने दे.
- वापरकर्त्याने इंग्रजी मागितल्यास इंग्रजीत उत्तर दे.
- स्वतःची ओळख सौरभ भैया AI अशी दे.`
            },
            ...chatMessages
          ],
          max_tokens: 1000
        })
      }
    );

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      if (apiResponse.status === 401) {
        return respond("Groq API Key चुकीची आहे. Netlify मध्ये ती तपासा.");
      }

      if (apiResponse.status === 429) {
        return respond("Groq वापर मर्यादा पूर्ण झाली आहे. थोड्या वेळाने प्रयत्न करा.");
      }

      return respond(
        "Groq Error: " +
        (result.error?.message || "AI सेवा उपलब्ध नाही.")
      );
    }

    const answer = result.choices?.[0]?.message?.content;

    if (!answer || !answer.trim()) {
      return respond("मला उत्तर मिळाले नाही. पुन्हा प्रयत्न करा.");
    }

    return respond(answer.trim());

  } catch (error) {
    return respond("Server Error: " + error.message);
  }
};
      
