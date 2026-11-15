
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method not allowed"
    };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("API key missing");
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "AI service error"
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reply: data.choices[0].message.content
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Backend error"
      })
    };
  }
};
