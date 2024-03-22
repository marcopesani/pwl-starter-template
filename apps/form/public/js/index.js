document.addEventListener("DOMContentLoaded", function () {
  // Ottieni riferimenti agli elementi del DOM necessari per il funzionamento della pagina
  const form = document.getElementById("contentForm");
  const submitButton = document.getElementById("submitButton");
  const showOnLoad = document.querySelectorAll(".loading-visible");
  const hideOnLoad = document.querySelectorAll(".loading-hidden");
  const contentContainer = document.getElementById("contentContainer");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  let content, error;

  // Abilita il pulsante di invio del form
  const enableSubmitButton = () => {
    submitButton.disabled = false;
  };

  // Disabilita il pulsante di invio del form
  const disableSubmitButton = () => {
    submitButton.disabled = true;
  };

  // Gestisce l'inizio del caricamento, disabilitando il form e mostrando gli elementi di caricamento
  const startLoading = () => {
    form.disabled = true;
    disableSubmitButton();
    showOnLoad.forEach((element) => element.classList.remove("hidden"));
    hideOnLoad.forEach((element) => element.classList.add("hidden"));
  };

  // Gestisce la fine del caricamento, riabilitando il form e nascondendo gli elementi di caricamento
  const stopLoading = () => {
    form.disabled = false;
    enableSubmitButton();
    showOnLoad.forEach((element) => element.classList.add("hidden"));
    hideOnLoad.forEach((element) => element.classList.remove("hidden"));

    if (error != null) {
      showError();
    } else {
      showContent();
    }
  };

  // Mostra lo stato di errore e nasconde gli altri stati
  const showError = () => {
    contentContainer.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.remove("hidden");
    const e = document.getElementById("error");
    e.textContent = error;
  };

  // Mostra il contenuto e nasconde gli stati di errore e vuoto
  const showContent = () => {
    contentContainer.classList.remove("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.add("hidden");

    // Aggiorna il contenuto dell'anteprima dell'email
    const subject = document.getElementById("subject");
    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");
    const cta1 = document.getElementById("cta-1");
    const cta2 = document.getElementById("cta-2");
    const body = document.getElementById("body");
    const hero = document.getElementById("hero");

    subject.textContent = content.subject;
    title.textContent = content.title;
    subtitle.textContent = content.subtitle;
    cta1.textContent = content.cta;
    cta2.textContent = content.cta;
    body.textContent = content.body;
    hero.src = `/form/generate-image?prompt=${encodeURIComponent(
      content.imagePrompt
    )}`;
  };

  // Gestisce il cambiamento del form, abilitando o disabilitando il pulsante di invio
  const handleFormChange = () => {
    const formData = new FormData(form);
    const brief = formData.get("brief");

    if (brief) {
      enableSubmitButton();
    } else {
      disableSubmitButton();
    }
  };

  // Gestisce l'invio del form, inviando i dati al server e gestendo la risposta
  const handleFormSubmission = (event) => {
    event.preventDefault();
    startLoading();

    fetch("/form/create", {
      method: "POST",
      accept: "application/json",
      body: new FormData(form),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }

        content = data;
        error = null;
      })
      .catch((e) => {
        content = null;
        error = e;
        console.error(e);
      })
      .finally(() => {
        stopLoading();
      });
  };

  // Aggiunge gli event listener per gestire l'invio del form e il cambiamento dei suoi campi
  form.addEventListener("submit", handleFormSubmission);
  form.addEventListener("input", handleFormChange);

  // Inizializza lo stato del form al caricamento della pagina
  handleFormChange();
  // Sostituisci le icone con Feather Icons
  feather.replace();
});
