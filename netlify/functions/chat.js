
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("API key missing");
    }

    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const validMessages = messages
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-16);

    if (!validMessages.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message required" })
      };
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.8,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content: `तुझे नाव सौरभ भैया AI आहे.
तू एक हुशार, मैत्रीपूर्ण आणि मदत करणारा मराठी AI Assistant आहेस.

नियम:
1. वापरकर्त्याशी प्रामुख्याने सोप्या मराठीत बोल.
2. प्रश्न समजून घेऊन अचूक उत्तर दे.
3. आधी दिलेली उत्तरे विनाकारण पुन्हा देऊ नकोस.
4. प्रत्येक उत्तर प्रश्नानुसार नैसर्गिक आणि वेगळे ठेव.
5. एकाच शब्दाची किंवा वाक्याची अनावश्यक पुनरावृत्ती टाळ.
6. उत्तर स्पष्ट आणि मुद्देसूद ठेव.
7. माहिती माहीत नसेल तर तसे प्रामाणिकपणे सांग.
8. वापरकर्त्याला समजेल अशा सोप्या भाषेत मार्गदर्शन कर.
9. स्वतःला सौरभ भैया AI म्हणून ओळख दे.`
            },
            ...validMessages
          ]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "AI service error"
        })
      };
    }

    const reply =
      result.choices?.[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reply: reply || "कृपया पुन्हा प्रश्न विचारा."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error"
      })
    };
  }
};
            
