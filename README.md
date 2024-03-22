
#  Template di Partenza Puglia Women Lead AI Hackaton

  

Questo progetto serve come punto di partenza per l'hackathon Puglia Women Lead AI, fornendo una configurazione server di base con Express. La guida seguente è progettata per assisterti nell'impostare il tuo ambiente di sviluppo, sia su Windows che su macOS, spiegando il motivo di ogni passaggio e la sua importanza.

  

##  Caratteristiche

  

-  **Server Express**: Fornisce un framework robusto per applicazioni web e mobili.

-  **Nodemon**: Utilizzato per riavviare automaticamente il server quando i file vengono modificati, migliorando l'efficienza dello sviluppo.

  

##  Configurazione dell'Ambiente di Sviluppo

  

###  Prerequisiti

  

Prima di iniziare, assicurati di avere installato Git e Node.js sul tuo sistema. Questi strumenti sono essenziali per clonare il repository e gestire le dipendenze del progetto.

  

-  **Git**: Sistema di controllo versione per tracciare le modifiche al codice sorgente.

-  **Node.js 16**: Ambiente di esecuzione per JavaScript lato server.

  

###  Installazione su Windows

  

1.  **Git**: Scarica e installa Git da [git-scm.com](https://git-scm.com/). Durante l'installazione, lascia tutte le opzioni predefinite.

2.  **Node.js**: Scarica e installa Node.js da [nodejs.org](https://nodejs.org/). Assicurati di selezionare la versione 16 LTS per garantire la compatibilità con le dipendenze del progetto.

  

###  Installazione su macOS

  

1.  **Git**: Di solito è già installato su macOS. Puoi verificarlo aprendo il Terminale e digitando `git --version`. Se non è installato, verrà proposto di installarlo.

2.  **Node.js**: È consigliato installare Node.js tramite [Homebrew](https://brew.sh/), un gestore di pacchetti per macOS. Apri il Terminale e digita `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` per installare Homebrew. Successivamente, installa Node.js versione 16 con `brew install node@16`.

  

###  Configurazione del Progetto

  

Dopo aver configurato l'ambiente di sviluppo, segui questi passi per iniziare a lavorare sul progetto:

  

1.  **Clonazione del Repository**: Apri il Terminale o Prompt dei comandi e digita `git clone https://github.com/marcopesani/pwl-starter-template.git` per clonare il progetto.

2.  **Navigazione nella Directory**: Digita `cd pwl-starter-template` per spostarti nella directory del progetto.

3.  **Installazione delle Dipendenze**: Esegui `npm install` per installare le dipendenze necessarie al progetto. Questo passaggio è cruciale per assicurarsi che tutti i pacchetti richiesti siano disponibili.

4.  **Avvio del Server di Sviluppo**: Con `npm run dev`, avvierai il server con Nodemon, che monitorerà i cambiamenti ai file e riavvierà automaticamente il server, facilitando lo sviluppo.

5.  **Creazione delle varibili d'ambiente**: Create nella cartella del progetto un file di testo di nome `.env` (occhio al punto!). All'interno di questo file dovrete inserire le seguenti righe:

```
OPENAI_API_KEY="..."
OPENAI_ASSISTANT_ID="..."
```
  ovviamente dopo aver creato una api key e un assistente sulla piattaforma di OpenAI.
  

##  Script Disponibili

  

-  `npm start`: Avvia il server in modalità produzione.

-  `npm run dev`: Avvia il server in modalità sviluppo con Nodemon.

  

##  Contribuire

  

I contributi sono benvenuti! Sentiti libero di inviare una pull request o aprire un problema se hai suggerimenti o trovi dei bug.

  

##  Licenza

  

Questo progetto è concesso in licenza sotto la Licenza Apache-2.0 - vedi il file [LICENSE](LICENSE) per i dettagli.

  

##  Ringraziamenti

  

Questo progetto è parte dell'iniziativa hackathon Puglia Women Lead AI, che mira a promuovere la partecipazione femminile nel campo della tecnologia e dell'intelligenza artificiale.

  

Scopri di più su Puglia Women Lead sul [sito ufficiale](https://pugliawomenlead.com/) e sull'evento Puglia Women AI sulla [pagina dedicata](https://pugliawomenlead.com/prodotto/puglia-women-ai/).