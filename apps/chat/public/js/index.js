let messages = [],
  currentMessage = -1;
const session = `${Date.now()}-${Math.random()}`;

document.addEventListener("DOMContentLoaded", function () {
  const messagesContainer = document.getElementById("messagesContainer");
  const messagesOverflow = document.getElementById("messagesOverflow");
  const inputForm = document.getElementById("inputForm");
  const baseMessage = document.getElementById("baseMessage").cloneNode(true);

  function renderMessages() {
    messagesContainer.innerHTML = "";

    messages.forEach((message) => {
      const clone = baseMessage.cloneNode(true);
      clone.id = message.id;
      clone.querySelector(".messageContent").textContent = message.message;
      clone.querySelector(".messageRole").textContent =
        message.role === "user" ? "You" : "Assistant";
      clone.querySelector(
        ".messageImage"
      ).src = `https://gravatar.com/avatar/${message.role}?s=100&d=retro&r=x`;
      clone.classList.remove("hidden");
      messagesContainer.appendChild(clone);
    });

    // Scroll messagesOverflow to bottom after rendering messages
    messagesOverflow.scrollTop = messagesOverflow.scrollHeight;
  };

  const startStream = async (prompt) => {
    let answer = "";
    const response = await fetch("/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        session,
      }),
    });
    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const partial = value
        .split("\n")
        .filter((v) => v)
        .map((v) => JSON.parse(v))
        .reduce((acc, v) => {
          return acc + (v.choices[0].delta.content || "");
        }, "");
      answer = answer + partial;
      messages[currentMessage].message = answer;
      renderMessages();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const message = formData.get("message");
    messages = [
      ...messages,
      { id: `message-${messages.length + 1}`, role: "user", message },
      { id: `message-${messages.length + 2}`, role: "assistant", message: "" },
    ];
    currentMessage = messages.length - 1;
    renderMessages();
    startStream(message);
    messagesOverflow.scrollTop = messagesOverflow.scrollHeight;
    e.target.reset();
  };

  const handleFormChange = (e) => {
    const textarea = e.target;
    const lines = textarea.value.split("\n").length;
    textarea.rows = lines;
  };

  inputForm.addEventListener("submit", handleFormSubmit);
  inputForm.addEventListener("input", handleFormChange);
  feather.replace();
});
