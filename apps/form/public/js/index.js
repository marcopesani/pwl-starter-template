document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contentForm");
  const submitButton = document.getElementById("submitButton");
  const showOnLoad = document.querySelectorAll(".loading-visible");
  const hideOnLoad = document.querySelectorAll(".loading-hidden");
  const contentContainer = document.getElementById("contentContainer");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  let content, error;

  function enableSubmitButton() {
    submitButton.disabled = false;
  }

  function disableSubmitButton() {
    submitButton.disabled = true;
  }

  function startLoading() {
    form.disabled = true;
    disableSubmitButton();
    showOnLoad.forEach((element) => element.classList.remove("hidden"));
    hideOnLoad.forEach((element) => element.classList.add("hidden"));
  }

  function stopLoading() {
    form.disabled = false;
    enableSubmitButton();
    showOnLoad.forEach((element) => element.classList.add("hidden"));
    hideOnLoad.forEach((element) => element.classList.remove("hidden"));

    if (error) {
      showError();
    } else {
      showContent();
    }
  }

  function showError() {
    contentContainer.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.remove("hidden");
    errorState.textContent = error;
  }

  function showContent() {
    contentContainer.classList.remove("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.add("hidden");

    const subject = document.getElementById("subject");
    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");
    const cta1 = document.getElementById("cta-1");
    const cta2 = document.getElementById("cta-2");
    const body = document.getElementById("body");

    subject.textContent = content.subject;
    title.textContent = content.title;
    subtitle.textContent = content.subtitle;
    cta1.textContent = content.cta;
    cta2.textContent = content.cta;
    body.textContent = content.body;
  }

  function handleFormChange() {
    const formData = new FormData(form);
    const brief = formData.get("brief");

    if (brief) {
      enableSubmitButton();
    } else {
      disableSubmitButton();
    }
  }

  function handleFormSubmission(event) {
    event.preventDefault();
    startLoading();

    fetch("/form/create", {
      method: "POST",
      accept: "application/json",
      body: new FormData(form),
    })
      .then((response) => response.json())
      .then((data) => {
        content = data;
        stopLoading();
      })
      .catch((error) => {
        stopLoading();
        error = error.message;
        console.error("Error handling form submission:", error);
      });
  }

  form.addEventListener("submit", handleFormSubmission);
  form.addEventListener("input", handleFormChange);

  handleFormChange();
  feather.replace();
});
