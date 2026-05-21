# Progetto OGA - Workforce Management per Fedrigoni

Questo repository contiene il prototipo completo di un sistema di Workforce Management.
Il progetto è stato sviluppato per il caso Fedrigoni Self-Adhesives Arco e si concentra su:
- pianificazione turni e assegnazione postazioni,
- gestione delle competenze e della qualification matrix,
- controllo delle assenze e permessi,
- supporto decisionale basato su vincoli operativi,
- interfaccia operatore e planner.

## Architettura del progetto

Il sistema è un'applicazione full-stack con due parti principali:

### Backend
- `backend/`
- Node.js + Express + TypeScript
- MongoDB con Mongoose
- Autenticazione JWT
- Ruoli utente: `OPERATOR`, `PLANNER`, `ADMIN`
- Modelli principali:
  - `Employee`
  - `User`
  - `Competence`
  - `Workstation`
  - `ShiftAssignment`
  - `Absence`
- Servizio di scheduling `backend/src/services/scheduler.ts` che genera turni settimanali utilizzando:
  - qualifiche per postazione,
  - assenze approvate,
  - limitazioni HSE,
  - vincoli di riposo di 11 ore,
  - gestione turni livello 1/2 e affiancamento livello 3.

### Frontend
- `frontend/`
- React 19 + Vite + TypeScript
- Routing con `react-router-dom`
- Autenticazione e role-based routing
- Pagine principali:
  - login
  - planner dashboard
  - operator dashboard
  - richiesta assenze
  - matrice competenze
  - gestione assenze

## Allineamento con il report

Questo progetto è pensato come un prototipo operativo che traduce i punti chiave del report:
- `decision support` anziché automazione cieca,
- gestione strutturata delle competenze e dei vincoli,
- supporto alle scelte make-or-buy tramite un'applicazione interna di validazione,
- capacità di funzionare come strumento di specifica per un'RFP vendor,
- integrazione di assenze, permessi e livelli di qualificazione.

La logica di scheduling implementata richiede che il sistema generi una proposta e lasci la validazione al planner, in linea con l'approccio suggerito dal report.

## Prerequisiti

- Node.js 24+
- npm
- MongoDB in esecuzione (locale o Atlas)
- Browser moderno

## Installazione

### 1. Installare le dipendenze

Dal root del repository:

```bash
cd d:\ProgettoOGA
npm install
```

Poi installare le dipendenze di backend e frontend:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configurare le variabili ambiente

Nel backend creare un file `.env` con almeno:

```env
MONGODB_URI=mongodb://localhost:27017/oga
JWT_SECRET=una-chiave-segreta
PORT=5000
```

### 3. Seeding del database

È consigliato popolare il database con dati di test e workstation:

```bash
cd backend
npm run seed  # crea utenti, dipendenti, competenze, assenze di esempio
```

Se necessario, eseguire anche il seed delle workstation:

```bash
cd backend
node src/seed_workstations.ts
```

> Nota: il seed primario utilizza la lista di workstation caricata da `seed_workstations.ts` se presente; in caso contrario usa un fallback.

## Avvio del progetto

Dal root del repository:

```bash
npm run dev
```

Questo comando avvia in parallelo:
- backend su `http://localhost:5000`
- frontend su `http://localhost:5173`

In alternativa si possono avviare separatamente:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## API principali

- `POST /api/auth/login` — login e generazione JWT
- `GET /api/employees` — elenco dipendenti
- `GET /api/competences` — matrici delle competenze
- `PUT /api/competences/:employeeId` — aggiornamento competenze (PLANNER / ADMIN)
- `GET /api/workstations` — postazioni operative
- `GET /api/schedule` — schedule generato
- `POST /api/schedule/generate` — genera nuovo schedule (PLANNER / ADMIN)
- `GET /api/absences` — lista assenze
- `POST /api/absences` — richiesta assenza
- `PUT /api/absences/:id` — modifica stato richiesta (PLANNER / ADMIN)

## Come usare il prototipo

### Ruoli utente
- `OPERATOR`: visualizza il proprio turno e può inviare richieste di assenza.
- `PLANNER`: gestisce competenze, genera schedule e approva assenze.

### Funzionalità chiave
- consultazione della matrice di competenze,
- gestione assenze e permessi,
- generazione assistita della programmazione turni,
- supporto alla gestione operativa del personale,
- differenziazione UI tra operatori e planner.

## Struttura del repository

- `backend/` — server Express, autenticazione, scheduler, modelli Mongoose.
- `frontend/` — applicazione React, autenticazione, pagine e componenti UI.

## Note tecniche

- Il backend utilizza Mongoose per modellare documenti distribuiti e flessibili,
- lo scheduler implementa vincoli di competenze e riposo in modo euristico,
- il frontend è organizzato con percorsi protetti e pagine distinte per ruolo,
- il repository include un prototipo funzionale utile anche come base per un futuro passaggio a una soluzione vendor.

## Consigli per l’evoluzione

- integrare un vero motore di ottimizzazione per le assegnazioni,
- aggiungere supporto a permessi normativi avanzati (Legge 104, CCNL) e validazione sindacale,
- predisporre una RFP formale basata sui requisiti del report,
- aggiungere test automatici per backend e componenti frontend.
