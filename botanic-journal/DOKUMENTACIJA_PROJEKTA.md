# Botanic Journal — Dokumentacija projekta

> Kompletan vodič kroz projekt: što je, kako radi, koji fileovi postoje, čemu služe i koje tehnike koriste. Strukturirano za učenje i obranu projekta.

---

## 1. Što je projekt (ukratko)

**Botanic Journal** je web aplikacija za vrtlare/ljubitelje biljaka. Korisnik vodi "dnevnik" svojih biljaka: dodaje biljke, prati zadatke njege (zalijevanje, gnojidba…), piše dnevničke zapise, koristi AI alate (chat, dijagnoza bolesti po slici, dizajner vrta…), sudjeluje u zajednici (forum, poruke) i prati statistiku.

Aplikacija ima **dva odvojena dijela**:

- **Frontend** (`frontend/`) — ono što korisnik vidi u pregledniku. React aplikacija.
- **Backend** (`backend/`) — server koji čuva podatke i obavlja logiku. PHP + MySQL baza.

Frontend i backend razgovaraju preko **HTTP zahtjeva** (frontend šalje `fetch`, backend vraća JSON).

---

## 2. Tehnologije (tech stack)

| Sloj | Tehnologija | Čemu služi |
|------|-------------|-----------|
| Frontend | **React 19** | Izrada korisničkog sučelja kroz komponente |
| Frontend build | **Vite 7** | Razvojni server (`npm run dev`) + build za produkciju |
| Grafovi | **Chart.js** + `react-chartjs-2` | Statistički grafovi (Analytics) |
| Kalendar | **FullCalendar** | Kalendar zadataka (Garden Planner) |
| Stilovi | **Obični CSS** (32 datoteke) | Izgled + tamni način rada |
| Ikone | **Font Awesome** (preko CDN-a) | Ikonice u sučelju |
| Backend | **PHP** (bez frameworka) | Poslovna logika, API endpointi |
| Baza | **MySQL** (preko **PDO**) | Pohrana podataka |
| Server | **XAMPP / Apache** | Posluživanje PHP-a lokalno |
| AI | **Groq API** (Llama modeli) | Chat, dijagnoza, generiranje sadržaja |
| Composer | `vlucas/phpdotenv` | (deklarirano, ali se u praksi ne koristi) |

**Ključna ideja arhitekture:** klasična podjela na **klijent–server**. Frontend je "tanak" (samo prikaz + slanje zahtjeva), backend radi sve s podacima.

---

## 3. Kako sve radi zajedno (tok podataka)

Primjer: korisnik otvori stranicu "Moje biljke".

```
1. React komponenta MyPlants.jsx se učita
2. Pozove  apiService.getPlants(user_id)   (iz frontend/src/services/api.js)
3. api.js napravi  fetch('.../backend/api/plants/plants.php?user_id=9')
4. PHP skripta plants.php se izvrši na Apache serveru
5. plants.php se spoji na MySQL (PDO) i dohvati biljke korisnika
6. Vrati JSON:  { success: true, data: [ ...biljke... ] }
7. api.js vrati taj JSON komponenti
8. MyPlants.jsx spremi podatke u state (useState) i React iscrta kartice
```

Svaki "ekran" u aplikaciji radi po istom principu: **komponenta → api.js → PHP endpoint → MySQL → natrag JSON**.

---

## 4. FRONTEND

### 4.1. Ulazne točke (gdje aplikacija počinje)

| Datoteka | Uloga |
|----------|-------|
| `frontend/index.html` | HTML "ljuska". Ima `<div id="root">` i učita `/src/main.jsx`. Tu je i link na Font Awesome. |
| `frontend/src/main.jsx` | Startna točka Reacta. Uzme `#root` i u njega ubaci `<App />`. Učita globalni `index.css`. |
| `frontend/src/App.jsx` | **Mozak frontenda.** Drži glavno stanje aplikacije i odlučuje koja se "stranica" prikazuje. |

### 4.2. App.jsx — kako funkcionira navigacija

Aplikacija je **SPA (Single Page Application)** — nema klasičnog mijenjanja stranica, sve je na jednoj.

- `App.jsx` drži stanje `activeView` (npr. `'dashboard'`, `'plants'`, `'tasks'`…).
- Funkcija `renderContent()` ima veliki `switch` koji prema `activeView` vraća odgovarajuću komponentu.
- **Routing preko hash-a:** koristi `window.location.hash` (npr. `#tasks`). Kad se hash promijeni, postavi se `activeView`. Tako linkovi rade i osvježavanje stranice pamti gdje si bio.
- Drži i: `isAuthenticated` (jesi li prijavljen), `currentUser` (podaci korisnika), `notifications` (skočne obavijesti).
- Ako **nisi** prijavljen → prikazuje `Login` ili `Register`. Ako **jesi** → prikazuje `Sidebar` + `Header` + sadržaj.

> Napomena: `react-router-dom` je instaliran, ali se **ne koristi** — navigacija je ručno napravljena preko hash-a.

### 4.3. Sloj za komunikaciju sa serverom — `services/api.js`

Ovo je **jedino mjesto** koje razgovara s backendom. Ima ~126 metoda (jedna po akciji).

- Na vrhu definira `API_BASE_URL` = adresa backenda (`.../backend/api`).
- Centralna metoda `request(endpoint, options)` radi `fetch`, dodaje zaglavlja, parsira JSON i hvata greške.
- Sve ostale metode su "kratice": `getPlants()`, `createPlant()`, `getTasks()`, `login()`, `plantChat()`… svaka samo pozove `request()` s pravim endpointom.

Primjer: `getPlants(user_id)` → `request('plants/plants.php?user_id=...')`.

### 4.4. Hook — `hooks/useTheme.js`

Upravlja **svijetlim/tamnim načinom rada**:
- Na početku pročita izbor iz `localStorage` (ili koristi postavku operativnog sustava).
- Kad je tamni način, stavi atribut `data-theme="dark"` na `<html>`. Time se aktiviraju sva pravila iz `dark-mode.css`.
- Pamti izbor u `localStorage`.

> Ovo je primjer **custom React hooka** (vlastita funkcija koja koristi `useState`/`useEffect` za dijeljenu logiku).

### 4.5. Pomoćne funkcije — `utils/`

| Datoteka | Čemu služi |
|----------|-----------|
| `avatar.js` | Generira/obrađuje URL avatara korisnika |
| `dateFormat.js` | Formatira datume (npr. dan/mjesec/godina) |
| `exportReport.js` | Priprema HTML za izvoz izvještaja (koristi `ExportButton`) |

### 4.6. Komponente (po grupama)

Sve su u `frontend/src/components/`. Svaka grupa je svoja mapa.

**Layout (kostur sučelja)**
- `Layout/Sidebar.jsx` — lijevi izbornik s linkovima na sve dijelove. Ima i mobilnu verziju (donji izbornik + ladica).
- `Layout/Header.jsx` — gornja traka: pozdrav, profil, prekidač teme, zvonce obavijesti.

**Auth (prijava)**
- `Auth/Login.jsx` — forma za prijavu.
- `Auth/Register.jsx` — forma za registraciju.

**Dashboard (početna)**
- `Dashboard/Dashboard.jsx` — glavna ploča s pregledom.
- `Dashboard/StatsGrid.jsx`, `QuickActions.jsx`, `WeatherWidget.jsx`, `AnalyticsChart.jsx` — manji "widgeti" unutar dashboarda. `AnalyticsChart` crta grafove (Chart.js).

**Plants (biljke)**
- `Plants/MyPlants.jsx` — popis tvojih biljaka (kartice, pretraga, sortiranje, grid/lista prikaz).
- `Plants/PlantCard.jsx`, `PlantGrid.jsx` — pomoćne komponente za prikaz kartica.
- `Plants/PlantDetail.jsx` — detaljni prikaz jedne biljke (tabovi: pregled, njega, galerija, savjeti).

**Tasks (zadaci njege)**
- `Tasks/CareTasks.jsx` — popis zadataka (zalijevanje, gnojidba…), označavanje gotovih, filtri.

**Journal (dnevnik)**
- `Journal/PlantJournal.jsx` — dnevnički zapisi uz biljke, s mogućnošću dodavanja fotografija.

**Encyclopedia (enciklopedija)**
- `Encyclopedia/PlantEncylopedia.jsx` — baza biljaka iz koje korisnik može dodati biljku u svoju kolekciju.

**AI alati** (koriste Groq preko backenda)
- `PlantChat/PlantChat.jsx` — chat asistent za biljke.
- `PlantDoctor/PlantDoctor.jsx` — dijagnoza bolesti po **fotografiji** (AI vid).
- `PlantDetective/PlantDetective.jsx` — kviz/igra dijagnoze + (u istom ekranu) **Plant Anatomy** explorer.

**Garden Map (mapa vrta)**
- `GardenMap/GardenMapDesigner.jsx` — povlačenje biljaka (drag & drop) na "platno" po zonama (balkon, dvorište…). U istom ekranu je i **Live Garden** (tab).
- `GardenMap/AIDesignerModal.jsx` — AI predlaže raspored biljaka prema opisu prostora.

**Live Garden**
- `LiveGarden/LiveGarden.jsx` — animirani "pixel-art" panoramski prikaz tvojih biljaka (dan/noć, kiša, pčele…). Čisto vizualno/zabavno.

**Planner (planer)**
- `Planner/GardenPlanner.jsx` — **kalendar zadataka** (FullCalendar). Brze akcije vode na popis zadataka.

**Eco Impact**
- `EcoImpact/CarbonOffset.jsx` — procjena "uštede CO₂" tvojih biljaka.
- `EcoImpact/PlantAnatomy.jsx` — interaktivni prikaz dijelova biljke (sad živi unutar Plant Detective).

**Community (forum)**
- `Community/CommunityForum.jsx` — popis tema/diskusija.
- `Community/DiscussionDetail.jsx` — jedna diskusija + odgovori.
- `Community/NewDiscussionModal.jsx`, `CommunityCategoryFiter.jsx`, `CommunityDiscussionCard.jsx` — pomoćne.

**Social (društveno)**
- `Social/Gardeners.jsx` — popis drugih korisnika.
- `Social/PublicProfile.jsx` — javni profil korisnika.
- `Social/Messages.jsx` — privatne poruke (chat, privici, emoji).

**Plant Requests (prijedlozi biljaka)**
- `PlantRequest/PlantRequestForm.jsx` — korisnik predloži novu biljku za enciklopediju.
- `PlantRequest/MyPlantRequests.jsx` — status mojih prijedloga.

**Admin (administrator)**
- `Admin/AdminDashboard.jsx` — upravljanje korisnicima/biljkama.
- `Admin/PlantRequestManager.jsx` — odobravanje/odbijanje prijedloga biljaka.

**Ostalo / UI**
- `Analytics/Analytics.jsx` — stranica statistike (omotač oko `AnalyticsChart`).
- `Weather/WeatherForecast.jsx` — vremenska prognoza.
- `Profile/Profile.jsx` — profil korisnika.
- `Notifications/NotificationBell.jsx` — zvonce s obavijestima.
- `Export/ExportButton.jsx` — gumb za izvoz izvještaja.
- `UI/Notification.jsx` — skočna obavijest (toast).

### 4.7. Stilovi i tamni način rada — `src/css/`

- Svaka veća komponenta ima svoj CSS (`plants.css`, `tasks.css`, `gardenMap.css`…). Sve su sad lijepo u mapi `css/`.
- `index.css` / `App.css` — globalni stilovi.
- `dark-mode.css` — **poseban file** koji se aktivira samo kad je `data-theme="dark"` na `<html>`. On "pregazi" boje pozadina, tekstova i okvira tamnim verzijama. (Zato kad popravljamo tamni način, mijenjamo ovaj file.)

---

## 5. BACKEND

Backend je skup **PHP skripti**. Nema frameworka — svaka skripta je samostalna i sama obrađuje zahtjev.

### 5.1. Struktura

```
backend/
├── index.php          → ulazna točka / "health check" ("API radi")
├── composer.json/lock → Composer ovisnosti (autoload)
├── .env               → (postoji, ali se NE koristi — vidi dolje)
├── config/            → konfiguracija
├── api/               → svi endpointi (grupirani u mape)
├── models/            → klase za rad s bazom (djelomično korištene)
├── database/          → SQL dump + migracije
└── uploads/           → uploadane datoteke (slike, privici)
```

### 5.2. `config/` — konfiguracija

| Datoteka | Uloga |
|----------|-------|
| `database.php` | Klasa `Database` koja se spaja na MySQL (PDO). **Podaci za spajanje su upisani direktno** (`localhost`, baza `botanic_journal`, korisnik `root`, prazna lozinka). |
| `cors.php` | Postavlja CORS zaglavlja (dopušta da frontend s `localhost:5173` zove backend). |
| `http.php` | Pomoćna funkcija `httpPostJson()` — šalje HTTP POST zahtjeve (koristi se za AI pozive). Ima i podršku za dodatna zaglavlja (npr. `Authorization`). |
| `groq.php` | **AI konfiguracija (Groq).** Drži API ključ, naziv modela i dvije funkcije: `groqChat()` (tekst) i `groqVision()` (slika). |
| `gemini.php` | Stara Gemini konfiguracija — **više se ne koristi** (prešli smo na Groq). |
| `anthropic.php` | Konfiguracija za Claude — **nije u upotrebi.** |

> **Bitno:** `.env` datoteka se u praksi ne učitava — `database.php` ima upisane podatke izravno. `.env` je "mrtav" file.

### 5.3. `api/` — endpointi (grupirani u mape)

Svaki endpoint je `.php` skripta koja:
1. Postavi CORS zaglavlja.
2. Pročita metodu (`GET`/`POST`/`PUT`/`DELETE`) i/ili `action` parametar.
3. Spoji se na bazu i obavi posao.
4. Vrati JSON `{ success, data/message }`.

Endpointi su organizirani ovako:

| Mapa | Datoteke | Čemu služe |
|------|----------|-----------|
| `api/ai/` | daily-care-note, plant-chat, plant-detective, plant-doctor, garden-map-design, garden-map-tip | Svi **AI** pozivi (Groq) |
| `api/plants/` | plants, plants-encyclopedia, plant-requests, journals, tasks, garden-map | Biljke, enciklopedija, dnevnik, zadaci, mapa vrta |
| `api/users/` | auth, user, profile, user-dashboard, user-stats, update-avatar, debug-user | Prijava, profil, statistika korisnika |
| `api/social/` | social, direct-messages, user-notifications | Praćenja, poruke, obavijesti |
| `api/insights/` | analytics, stats, weather | Statistika i vrijeme |
| `api/community/` | categories, discussions, likes, replies, stats | Forum |
| `api/admin/` | plants, stats, users | Administracija |

> **Zašto su grupirani?** Da `api/` ne bude pun ~25 razbacanih datoteka. Pri tome je u svakoj datoteci put do configa pomaknut za jednu razinu (`../config` → `../../config`), a u `api.js` su URL-ovi ažurirani (npr. `plant-chat.php` → `ai/plant-chat.php`).

### 5.4. `models/` — klase za bazu

Sadrži klase `Plant`, `Task`, `Journal`, `CommunityCategory`, `CommunityDiscussion`, `CommunityReply`, `Database`.

> **Bitno za zapamtiti:** modeli postoje, ali ih koristi **samo dio** endpointa (uglavnom `community/*` i `plants/journals.php`). Većina ostalih endpointa radi **direktno s PDO-om** (pišu SQL upite ručno u samoj skripti). Dakle projekt je miks dva stila.

### 5.5. `database/`

- `botanic_journal.sql` — izvoz baze (glavne tablice: `users`, `plants`, `tasks`, `journals`, `garden_plans`, `care_schedules`, `seeds`, `weather`).
- `migrations/` — dodatne SQL skripte (npr. `plant_diagnoses.sql`).

> **Bitno:** dio tablica se **ne nalazi u dumpu** nego ih endpointi sami stvore prvim pozivom pomoću `CREATE TABLE IF NOT EXISTS` (npr. tablice za AI chat, dijagnoze, poruke, obavijesti, garden map). To su: `daily-care-note`, `plant-chat`, `plant-detective`, `plant-doctor`, `garden-map`, `direct-messages`, `social`, `user-notifications`.

### 5.6. `uploads/`

Spremaju se uploadane slike (fotografije biljaka, privici poruka, avatari, slike za dijagnozu). Endpointi koji primaju datoteke spremaju ih ovdje i u bazu zapišu putanju.

---

## 6. Baza podataka (MySQL)

Glavne tablice i što drže:

| Tablica | Sadržaj |
|---------|---------|
| `users` | Korisnici: ime, email, **hashirana lozinka**, uloga (`user`/`admin`), avatar |
| `plants` | Biljke korisnika (i enciklopedijske): naziv, vrsta, svjetlo, zalijevanje, status… |
| `tasks` | Zadaci njege: tip, datum, prioritet, je li gotov |
| `journals` | Dnevnički zapisi (uz biljke), opcionalno slika |
| `garden_plans` / `garden-map` | Raspored biljaka po zonama vrta |
| `care_schedules`, `seeds`, `weather` | Pomoćni podaci |
| (lazy tablice) | chat poruke, AI dijagnoze, detective slučajevi, privatne poruke, obavijesti, prijedlozi biljaka |

**Veza tablica:** gotovo sve imaju `user_id` koji pokazuje na `users.id` (tako se zna čije su biljke/zadaci/poruke).

---

## 7. AI integracija (Groq)

Aplikacija koristi **Groq** (besplatni AI servis, Llama modeli) za sve "pametne" funkcije.

**Kako radi jedan AI poziv (npr. Plant Chat):**
```
1. Frontend pošalje poruku → api/ai/plant-chat.php
2. Skripta složi "prompt" (uputu + povijest razgovora)
3. Pozove groqChat() iz config/groq.php
4. groqChat() pošalje HTTP POST na Groq API (httpPostJson + Bearer ključ)
5. Groq vrati tekst → skripta ga vrati frontendu kao JSON
```

- `groqChat()` — za **tekstualne** funkcije (chat, detektiv, savjeti, dnevna bilješka, dizajn vrta).
- `groqVision()` — za funkcije sa **slikom** (Plant Doctor: pošalje fotografiju kao base64 i traži dijagnozu).
- Za funkcije koje trebaju **strogi JSON** (detektiv, dizajner vrta, microclimate savjet) koristi se "JSON mode" + u promptu je točno opisan oblik odgovora.

**Konfiguracija** je u `backend/config/groq.php`:
- `GROQ_API_KEY` — tvoj ključ (s console.groq.com),
- `GROQ_MODEL` = `llama-3.3-70b-versatile` (tekst),
- `GROQ_VISION_MODEL` = `llama-4-scout` (slika).

> Prije se koristio Gemini, ali u EU besplatni nivo nije dostupan, pa smo prešli na Groq.

---

## 8. Autentikacija i sigurnost (JWT)

Aplikacija koristi **JWT (JSON Web Token)** autentikaciju.

**Osnove:**
- **Lozinke** se spremaju **hashirane** s `password_hash()` (bcrypt) — nikad u čistom tekstu. Prijava ih provjerava s `password_verify()`.

**Tok prijave i zaštite (korak po korak):**
```
1. Korisnik se prijavi (email + lozinka) → auth.php provjeri lozinku.
2. Ako je ispravna, server kreira POTPISAN token (JWT) koji sadrži user_id
   i vrijeme isteka, te ga vrati frontendu.
3. Frontend sprema token u localStorage.
4. Na SVAKI sljedeći zahtjev frontend automatski doda zaglavlje:
       Authorization: Bearer <token>
5. Middleware na serveru (auth_bootstrap.php) presretne SVAKI zahtjev,
   provjeri potpis tokena i izvuče user_id IZ TOKENA (ne iz URL-a).
6. Ako tokena nema ili je nevažeći → server vrati 401 (Unauthorized).
```

**Što je JWT:** tekstualni token iz 3 dijela (`header.payload.signature`). Bilo tko može pročitati `payload` (to je samo base64), ali **nitko ne može krivotvoriti potpis** bez tajnog ključa (`JWT_SECRET`). Zato server može vjerovati podatku (`user_id`) unutar tokena. Koristi se algoritam **HMAC-SHA256 (HS256)**.

**Datoteke koje to čine:**

| Datoteka | Uloga |
|----------|-------|
| `config/jwt.php` | Kreira (`jwt_encode`) i provjerava (`jwt_decode`) token; potpis + provjera isteka. |
| `config/auth_bootstrap.php` | **Middleware** — pokreće se prije svakog API poziva, validira token i forsira provjereni `user_id`. Bez tokena → 401. |
| `api/.htaccess` | Automatski uključi middleware prije svake skripte (`auto_prepend_file`) + propusti `Authorization` zaglavlje do PHP-a. |
| `auth.php` | Kod prijave kreira i vrati JWT. |
| `services/api.js` (frontend) | Globalni omotač koji svakom zahtjevu prema backendu doda `Authorization: Bearer` zaglavlje. |

**Zašto je ovo sigurno (ključna rečenica za obranu):**
> Identitet se više ne uzima iz URL-a (`?user_id=`), nego iz **potpisanog tokena** koji se validira na svakom zahtjevu. Napadač ne može krivotvoriti token bez tajnog ključa, niti se predstaviti kao drugi korisnik mijenjanjem `user_id`-a u URL-u — server taj parametar ignorira i koristi `user_id` iz tokena.

**Demonstracija na obrani:**
- U Network tabu pokažeš da login vraća `token` i da svaki zahtjev šalje `Authorization: Bearer ...`.
- Obrišeš token (Application → Local Storage) ili promijeniš `user_id` u URL-u → zaštićeni pozivi vraćaju **401** / i dalje vraćaju samo tvoje podatke. To dokazuje zaštitu.

**Daljnja moguća poboljšanja (ako te pitaju):**
- Token u **httpOnly cookie** umjesto `localStorage` (zaštita od XSS-a).
- **Refresh token** (kratki access token + dugi refresh token).
- **Rate limiting** na login (protiv brute-force napada).
- Sigurniji **reset lozinke** (token poslan na email umjesto izravne promjene).

---

## 9. Tehnike i koncepti koje projekt koristi (za ispit)

**Frontend**
- **Komponente** — sučelje razbijeno u male dijelove koji se ponovno koriste.
- **State (`useState`)** — komponenta pamti svoje podatke (npr. popis biljaka).
- **Efekti (`useEffect`)** — pokreni nešto kad se komponenta učita (npr. dohvati podatke).
- **Custom hook (`useTheme`)** — dijeljena logika izdvojena u funkciju.
- **`fetch` / async-await** — asinkroni pozivi serveru.
- **Hash routing** — navigacija bez ponovnog učitavanja stranice.
- **Drag & drop** — povlačenje biljaka u Garden Map.
- **Biblioteke:** Chart.js (grafovi), FullCalendar (kalendar).
- **CSS varijable + `data-theme`** — tamni način rada.

**Backend**
- **REST-ish API** — svaki endpoint radi CRUD (Create/Read/Update/Delete) operacije.
- **PDO + prepared statements** — siguran rad s bazom (zaštita od SQL injectiona).
- **`password_hash` / `password_verify`** — sigurno čuvanje lozinki.
- **CORS** — dopuštanje pristupa frontendu s drugog porta.
- **HTTP pozivi prema vanjskom AI-ju** (Groq) preko cURL/streamova.
- **JSON** kao format razmjene podataka.

**Općenito**
- **Klijent–server arhitektura** + odvojeni frontend/backend.
- **MVC-ish** (djelomično: modeli postoje, ali nije strogi MVC).

---

## 10. Kako pokrenuti projekt

**Backend (XAMPP):**
1. Pokreni Apache i MySQL u XAMPP-u.
2. U phpMyAdmin uvezi `backend/database/botanic_journal.sql` (stvori bazu `botanic_journal`).
3. Provjeri da je u `backend/config/groq.php` upisan Groq API ključ.

**Frontend:**
```bash
cd frontend
npm install      # samo prvi put
npm run dev      # pokrene razvojni server na http://localhost:5173
```

**Za produkciju:**
```bash
npm run build    # napravi optimiziranu verziju u frontend/dist/
```

---

## 11. Mapa cijelog projekta (brzi podsjetnik)

```
botanic-journal/
├── frontend/                    # React aplikacija (sve što korisnik vidi)
│   ├── index.html               # HTML ljuska
│   ├── package.json             # ovisnosti + skripte (dev/build)
│   ├── vite.config.js           # konfiguracija Vitea
│   ├── public/                  # statične datoteke (vite.svg)
│   └── src/
│       ├── main.jsx             # start Reacta
│       ├── App.jsx              # glavni "router" + stanje
│       ├── components/          # sve komponente (po grupama)
│       ├── services/api.js      # SVE komunikacije sa serverom
│       ├── hooks/useTheme.js    # svijetli/tamni način
│       ├── utils/               # pomoćne funkcije
│       └── css/                 # svi stilovi + dark-mode.css
│
├── backend/                     # PHP server
│   ├── index.php                # ulazna točka (health check)
│   ├── config/                  # database, cors, http, groq
│   ├── api/                     # endpointi: ai/ plants/ users/ social/ insights/ community/ admin/
│   ├── models/                  # klase za bazu (djelomično)
│   ├── database/                # SQL dump + migracije
│   └── uploads/                 # uploadane slike/datoteke
│
└── (dokumentacija .docx, README.md)
```

---

### Najvažnije rečenice za zapamtiti

1. **Frontend (React) + Backend (PHP/MySQL)**, razgovaraju preko `fetch` → JSON.
2. **`App.jsx`** odlučuje koji ekran se vidi (`activeView` + hash routing).
3. **`services/api.js`** je jedini most prema backendu.
4. **Svaki PHP endpoint** = samostalna skripta koja vrati `{ success, data }`.
5. **PDO + prepared statements** za bazu, **password_hash** za lozinke.
6. **AI** ide preko **Groq** (`config/groq.php`: `groqChat` za tekst, `groqVision` za slike).
7. **Tamni način** = `data-theme="dark"` na `<html>` + `dark-mode.css`.
8. **Sigurnost:** **JWT autentikacija** — login vraća potpisani token, middleware (`auth_bootstrap.php`) ga validira na **svakom** zahtjevu i uzima `user_id` iz tokena (ne iz URL-a); bez valjanog tokena → **401**.
