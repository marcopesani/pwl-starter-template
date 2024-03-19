let messages = [],
  currentMessage = -1;
let isStreaming = false;

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
        message.role === "user" ? "You" : window.__data.assistant.name;
      clone.querySelector(
        ".messageImage"
      ).src = `https://gravatar.com/avatar/${message.role}?s=100&d=retro&r=x`;
      clone.classList.remove("hidden");
      messagesContainer.appendChild(clone);
    });

    // Scroll messagesOverflow to bottom after rendering messages
    messagesOverflow.scrollTop = messagesOverflow.scrollHeight;
  }

  async function startStream(prompt) {
    isStreaming = true;
    const response = await fetch("/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        thread_id: window.__data.thread.id,
      }),
    });

    if (response.body) {
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let done, value;
      while (true) {
        ({ done, value } = await reader.read());
        if (done) {
          isStreaming = false;
          break;
        }
        messages[currentMessage].message = value;
        renderMessages();
      }
    }
  }

  async function stopStream() {
    if (isStreaming) {
      await fetch("/chat/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thread_id: window.__data.thread.id,
        }),
      });
      isStreaming = false;
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isStreaming) {
      await stopStream();
    }
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

  // Initialize UI
  inputForm.addEventListener("submit", handleFormSubmit);
  inputForm.addEventListener("input", handleFormChange);
  feather.replace();
});
