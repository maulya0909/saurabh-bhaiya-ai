
exports.handler = async (event) => {
  const send = (reply, statusCode = 200) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify({ reply })
  });

  if (event.httpMethod !== "POST") {
    return send("POST request आवश्यक आहे.", 405);
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return send("GROQ_API_KEY Netlify मध्ये सेट केलेली नाही.");
    }

    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const cleanMessages = messages
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      )
      .slice(-16);

    if (!cleanMessages.length) {
      return send("कृपया मला एखादा प्रश्न विचारा.");
    }

    const apiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `तुझे नाव सौरभ भैया AI आहे.

तू एक Advanced Marathi AI Assistant आहेस.

तुझे नियम:
1. सोप्या आणि स्पष्ट मराठीत उत्तर दे.
2. प्रत्येक प्रश्न समजून घेऊन उत्तर दे.
3. एकच वाक्य वारंवार वापरू नकोस.
4. अनावश्यक शब्दांची पुनरावृत्ती करू नकोस.
5. आधीच्या संभाषणाचा संदर्भ लक्षात ठेव.
6. प्रत्येक उत्तर प्रश्नानुसार तयार कर.
7. उत्तर माहितीपूर्ण आणि मुद्देसूद ठेव.
8. माहिती माहीत नसेल तर स्पष्ट सांग.
9. वापरकर्त्याला योग्य मार्गदर्शन कर.
10. स्वतःची ओळख सौरभ भैया AI अशी दे.`
            },
            ...cleanMessages
          ],
          temperature: 0.8,
          max_tokens: 700
        })
      }
    );

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      if (apiResponse.status === 401) {
        return send("Groq API Key चुकीची आहे. Netlify Environment Variables तपासा.");
      }

      if (apiResponse.status === 429) {
        return send("Groq ची सध्याची वापर मर्यादा पूर्ण झाली आहे. थोड्या वेळाने प्रयत्न करा.");
      }

      return send(
        "Groq API Error: " +
        (result.error?.message || "कनेक्शनमध्ये अडचण आली.")
      );
    }

    const answer = result.choices?.[0]?.message?.content;

    if (!answer) {
      return send("AI कडून उत्तर मिळाले नाही. पुन्हा प्रयत्न करा.");
    }

    return send(answer.trim());

  } catch (error) {
    return send("Server Error: " + error.message);
  }
};
                  
