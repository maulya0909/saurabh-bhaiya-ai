exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  const textHeaders = {
    ...headers,
    "Content-Type": "text/plain; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  let plainMode = false;

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY missing in Netlify");
    }

    let raw = event.body || "";
    if (event.isBase64Encoded) {
      raw = Buffer.from(raw, "base64").toString("utf-8");
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch (e) {
      parsed = null;
    }

    let messages;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      messages = (Array.isArray(parsed.messages) ? parsed.messages : [])
        .filter(m =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.trim()
        )
        .slice(-20);
    } else {
      plainMode = true;
      const text = raw.trim();
      messages = text ? [{ role: "user", content: text }] : [];
    }

    if (!messages.length) {
      if (plainMode) {
        return {
          statusCode: 200,
          headers: textHeaders,
          body: "कृपया काहीतरी बोला सर."
        };
      }
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Message required" })
      };
    }
const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    const instructions = plainMode
      ? `
तुझे नाव सई आहे.
तू एक हुशार, गोड आणि मदत करणारी मराठी व्हॉइस असिस्टंट आहेस.
वापरकर्त्याला नेहमी "सर" म्हणून संबोध.
नेहमी मराठीत उत्तर दे.
उत्तर लहान आणि बोलण्यासारखे ठेव (२-३ वाक्ये).
तारका (*), हॅश (#), इमोजी, लिस्ट किंवा कोड ब्लॉक वापरू नकोस, कारण उत्तर आवाजात वाचले जाते.
चुकीची माहिती देऊ नकोस. माहीत नसेल तर स्पष्ट सांग.
सध्याची भारतीय तारीख आणि वेळ: ${now}. वेळ किंवा तारीख विचारल्यास हीच वापर आणि मराठीत सांग.
 `
      : `
तुझे नाव सौरभ भैया आहे.

तू एक प्रगत, बुद्धिमान आणि सर्वसाधारण AI सहाय्यक आहेस.

तुझी मुख्य कामे:

- कोणत्याही सामान्य विषयावर प्रश्नांची उत्तरे दे.
- विज्ञान, गणित, इतिहास, भूगोल समजाव.
- अभ्यास आणि शिक्षणात मदत कर.
- मोबाईल, संगणक आणि टेक्नॉलॉजी समजाव.
- HTML, CSS, JavaScript आणि Python कोड लिही.
- शेती, व्यवसाय आणि सामान्य ज्ञानाबद्दल मदत कर.
- मराठी, हिंदी आणि इंग्रजी समज.
- कठीण प्रश्न सोप्या भाषेत समजाव.
- आवश्यक असल्यास उदाहरणे दे.
- गणिती प्रश्न काळजीपूर्वक सोडव.
- नवीन माहिती आवश्यक असल्यास Browser Search वापर.
- गणनेसाठी Code Interpreter वापर.
- चुकीची माहिती देऊ नकोस.
- माहिती माहीत नसेल तर स्पष्ट सांग.
- एकाच उत्तराची पुनरावृत्ती करू नकोस.
- मागील संभाषणाचा संदर्भ वापर.
- वापरकर्त्याला मराठीत उत्तर देणे पसंत आहे.
- उत्तर नैसर्गिक, स्पष्ट आणि उपयुक्त ठेव.
- स्वतः करू शकत नसलेली कृती केल्याचा दावा करू नकोस.

तू फक्त ठरावीक प्रश्नांची उत्तरे देणारा Bot नाहीस.
तू सर्वसाधारण AI Assistant आहेस.
`;

    const payload = {
      model: "openai/gpt-oss-20b",
      instructions,
      input: messages,
      reasoning: { effort: plainMode ? "low" : "medium" },
      max_output_tokens: plainMode ? 800 : 3000
    };

    if (!plainMode) {
      payload.tools = [
        { type: "browser_search" },
        {
          type: "code_interpreter",
          container: { type: "auto" }
        }
      ];
      payload.tool_choice = "auto";
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error?.message || "Groq API request failed"
      );
    }

    const reply = (result.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!reply.trim()) {
      throw new Error("AI response was empty");
    }

    if (plainMode) {
      return {
        statusCode: 200,
        headers: textHeaders,
        body: reply.trim()
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: reply.trim()
      })
    };

  } catch (error) {
    if (plainMode) {
      return {
        statusCode: 200,
        headers: textHeaders,
        body: "माफ करा सर, काहीतरी चूक झाली."
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Unknown server error"
      })
    };
  }
};
