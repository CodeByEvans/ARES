# ARES — Guía de Arquitectura

## Visión general

ARES es una Progressive Web App (PWA) de asistente por voz: el usuario habla y ARES responde con voz sintetizada. Todo el stack está pensado para funcionar sin coste de APIs externas, usando modelos locales (Ollama) y síntesis de voz gratuita (Edge-TTS).

## Stack

| Capa | Tecnología | Propósito |
|---|---|---|
| Frontend | React 19 + Vite 6 | UI y PWA |
| Estilos | Tailwind CSS 4 | Utilidades CSS |
| Animaciones | GSAP 3.12 | Transiciones y microinteracciones |
| Backend | Python 3.11+ + FastAPI | API REST |
| ASGI Server | Uvicorn | Servidor HTTP asíncrono |
| TTS | Edge-TTS (gratuito, local) | Síntesis de voz en español |
| IA | Ollama (modelo llama3.2) | LLM corriendo localmente en el VPS ARM64 |
| PWA | Service Worker + Manifest | Instalable, offline-ready |

## Estructura del proyecto

```
ARES/
├── package.json                  # Orquestador raíz (concurrently para dev)
├── ARCHITECTURE.md               # Este documento
│
├── backend/
│   ├── .env.example              # Plantilla de variables de entorno
│   ├── requirements.txt          # Dependencias Python
│   ├── server.py                 # Entry point alternativo (uvicorn.run)
│   └── app/
│       ├── __init__.py           # Re-exporta app y settings
│       ├── main.py               # Factory de FastAPI, CORS, DI wiring
│       ├── core/
│       │   └── config.py         # Settings con Pydantic (lee .env)
│       ├── routers/
│       │   ├── ask.py            # POST /api/ask — consulta al LLM
│       │   └── tts.py            # POST /api/tts — texto a voz
│       ├── schemas/
│       │   └── requests.py       # Modelos Pydantic (request/response)
│       └── services/
│           ├── ares_service.py   # ABC + implementación HTTP (Ollama)
│           ├── stt_service.py    # ABC para STT (sin implementar aún)
│           └── tts_service.py    # ABC + implementación Edge-TTS
│
└── frontend/
    ├── package.json              # Dependencias frontend
    ├── vite.config.js            # Vite + proxy /api → backend
    ├── index.html                # Shell HTML con meta tags PWA
    ├── public/
    │   ├── manifest.json         # PWA manifest (standalone, portrait)
    │   └── sw.js                 # Service Worker (cache-first)
    └── src/
        ├── main.jsx              # Entry point, registro del SW
        ├── App.jsx               # Componente raíz, orquesta layout y estado
        ├── index.css             # Tailwind + estilos globales
        ├── hooks/
        │   └── useVoice.js       # Hook principal: máquina de estados de voz
        ├── services/
        │   └── voiceService.js   # Cliente HTTP para /api/ask y /api/tts
        └── components/
            ├── MicrophoneButton.jsx   # Botón circular con animaciones GSAP
            ├── VoiceIndicator.jsx     # Barras de audio animadas + etiqueta
            ├── TalkModeToggle.jsx     # Toggle modo conversación continua
            └── ChatHistory.jsx        # Burbujas de chat con scroll automático
```

### Descripción de carpetas y archivos clave

| Archivo/Carpeta | Responsabilidad |
|---|---|
| `package.json` (raíz) | Script `dev` que arranca backend y frontend en paralelo con `concurrently` |
| `backend/app/main.py` | Crea la app FastAPI, configura CORS, registra rutas y cablea dependencias |
| `backend/app/core/config.py` | Carga variables de entorno en un objeto `Settings` tipado (Pydantic) |
| `backend/app/routers/` | Endpoints REST organizados por dominio (`ask`, `tts`) |
| `backend/app/schemas/requests.py` | Modelos de validación de entrada/salida para cada endpoint |
| `backend/app/services/` | Capa de abstracción: clases base (ABC) + implementaciones concretas |
| `frontend/src/hooks/useVoice.js` | Toda la lógica del pipeline de voz (máquina de estados) |
| `frontend/src/services/voiceService.js` | Capa HTTP desacoplada del hook |
| `frontend/src/components/` | Componentes puramente visuales, reciben props, emiten eventos |
| `frontend/public/sw.js` | Service Worker con estrategia cache-first + network update |
| `frontend/public/manifest.json` | Configuración PWA (instalable, pantalla completa, orientación vertical) |

## Flujo de datos

```
Usuario habla
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  PWA (navegador)                                                │
│                                                                 │
│  ┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌────────┐ │
│  │ MicButton │───▶│ Web Speech  │───▶│ useVoice │───▶│ voice  │ │
│  │ (GSAP)    │    │ API (STT)   │    │  hook    │    │Service │ │
│  └──────────┘    └─────────────┘    └──────────┘    └───┬────┘ │
│                                                         │      │
│  ┌──────────┐    ┌─────────────┐                        │      │
│  │ChatHistory│◀──│ Audio.play │◀─── voiceService ───────┘      │
│  │ (GSAP)   │    │  (TTS MP3) │    HTTP POST                   │
│  └──────────┘    └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
        ▲                                              │
        │               HTTP (JSON / MP3)              │
        │                                              ▼
┌───────┴─────────────────────────────────────────────────────────┐
│  Backend (FastAPI + Uvicorn, puerto 8000)                       │
│                                                                 │
│  POST /api/ask ──▶ AskRouter ──▶ HttpAresService ──▶ Ollama    │
│       │                            (localhost:11434)    (llama) │
│       │  { prompt, history }                                    │
│       │  { response, model }                                    │
│       ▼                                                         │
│  POST /api/tts ──▶ TtsRouter ──▶ EdgeTtsService ──▶ edge-tts   │
│       │                                                   (MP3) │
│       │  { text }                                               │
│       │  audio/mpeg (FileResponse)                              │
│       ▼                                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Paso a paso

1. **Usuario pulsa el micrófono** → `useVoice.startListening()` → `state = "listening"`
2. **Web Speech API** escucha y transcribe el audio a texto (es-ES)
3. **`processText(transcript)`** → `state = "thinking"` → `POST /api/ask` con `{prompt, history}`
4. **Backend `/api/ask`**: valida con Pydantic, construye el prompt con template de Llama 3.2, consulta a Ollama, devuelve la respuesta
5. **Frontend** recibe respuesta → `state = "speaking"` → `POST /api/tts` con `{text}`
6. **Backend `/api/tts`**: genera MP3 con Edge-TTS (voz `es-MX-DaliaNeural`), devuelve el archivo
7. **Frontend** reproduce el audio con `new Audio(blobUrl)`
8. Si **talkMode** está activo → vuelve al paso 2 automáticamente. Si no → `state = "idle"`

## Endpoints del backend

Base URL: `http://localhost:8000/api`

### `POST /api/ask`

Envía un mensaje al LLM y recibe la respuesta en texto.

**Request:**
```json
{
  "prompt": "¿Qué tiempo hace hoy?",
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! ¿En qué puedo ayudarte?" }
  ]
}
```

**Response:**
```json
{
  "response": "No tengo acceso a datos meteorológicos en tiempo real...",
  "model": "llama3.2"
}
```

**Validaciones:**
- `prompt`: string, 1-4000 caracteres
- `history`: array opcional de `{role: "user"|"assistant", content: string}`

**Flujo interno:**
- `AskRouter` recibe la petición → válida con `AskRequest` (Pydantic)
- Inyecta `AresService` (interfaz abstracta) → resuelve a `HttpAresService`
- `HttpAresService.ask()` construye el prompt con tokens especiales de Llama 3.2 (`<|system|>`, `<|user|>`, `<|assistant|>`)
- POST a `http://localhost:11434/api/generate` con `stream: false`
- Timeout: 30s (httpx). Si falla, devuelve mensaje de error amigable en español

### `POST /api/tts`

Convierte texto en audio MP3 usando Edge-TTS.

**Request:**
```json
{
  "text": "Hola, soy ARES, tu asistente de voz.",
  "voice": "es-MX-DaliaNeural",
  "lang": "es"
}
```

**Response:** `audio/mpeg` (StreamingResponse con el archivo MP3)

**Validaciones:**
- `text`: string, 1-4000 caracteres
- `voice`: string opcional (default: `es-MX-DaliaNeural`)
- `lang`: string opcional (default: `es`)

**Flujo interno:**
- `TtsRouter` recibe la petición → válida con `TtsRequest` (Pydantic)
- Inyecta `TtsService` (interfaz abstracta) → resuelve a `EdgeTtsService`
- `EdgeTtsService.synthesize()` genera audio con `edge_tts.Communicate`, guarda en archivo temporal, devuelve `FileResponse`

### `GET /api/health`

Health check para monitorización.
```json
{ "status": "ok", "service": "ARES Voice API" }
```

## Frontend

### Componentes y su responsabilidad

| Componente | Props | Rol |
|---|---|---|
| `App.jsx` | — | Orquestador raíz: conecta `useVoice` con todos los componentes hijos. Controla layout, header, body y footer |
| `MicrophoneButton.jsx` | `state`, `onClick`, `disabled` | Botón circular con icono de micrófono. Cambia color (gris/rojo/índigo/verde) según estado. Animaciones de pulso, escala elástica y feedback táctil |
| `VoiceIndicator.jsx` | `state` | Barras de audio animadas (8 barras verticales) + etiqueta de estado ("Escuchando...", "Procesando...", "Respondiendo...") |
| `TalkModeToggle.jsx` | `enabled`, `onChange` | Switch toggle para activar/desactivar el modo conversación continua. El knob se desliza con GSAP |
| `ChatHistory.jsx` | `messages` | Lista de burbujas de chat con scroll automático. Usuario (derecha, índigo) y asistente (izquierda, gris oscuro). Animación de entrada por mensaje |

### `useVoice` hook

El hook `useVoice.js` es el cerebro del frontend. Implementa una máquina de estados con 4 estados y gestiona todo el pipeline de voz.

#### Estados

```
  ┌──────────┐    click mic     ┌───────────┐    transcripción    ┌──────────┐    respuesta    ┌──────────┐
  │  IDLE    │ ───────────────▶ │ LISTENING │ ─────────────────▶ │ THINKING │ ─────────────▶ │ SPEAKING │
  │          │ ◀─────────────── │           │                    │          │ ◀───────────── │          │
  └──────────┘  audio termina   └───────────┘                    └──────────┘  audio termina └──────────┘
       ▲                              │                                │
       │                    talkMode ON: auto-reinicia                │
       └──────────────────────────────┴────────────────────────────────┘
                        stopListening() en cualquier momento
```

#### Ciclo completo

1. **`startListening()`** — Crea instancia de `SpeechRecognition` (Web Speech API, `lang=es-ES`, `interimResults=false`), registra handlers (`onresult`, `onerror`, `onend`), inicia reconocimiento
2. **`onresult`** — Extrae `transcript` del evento, llama a `processText(transcript)`
3. **`processText(text)`** — Cambia estado a `thinking`, añade mensaje del usuario al historial, llama a `voiceService.ask(prompt, history)`, añade respuesta del asistente al historial
4. **`playAudio(text)`** — Cambia estado a `speaking`, llama a `voiceService.synthesizeSpeech(text)`, crea `Audio` con blob URL, reproduce. Al terminar (`onended`): si `talkMode=true` → vuelve a `startListening()`, si no → `idle`
5. **`stopListening()`** — Aborta reconocimiento, vuelve a `idle`
6. **`stopSpeaking()`** — Pausa audio, resetea `currentTime`
7. **`toggleTalkMode()`** — Alterna modo conversación continua. Si se desactiva, detiene micrófono y audio
8. **`clearHistory()`** — Detiene todo, vacía historial, vuelve a `idle`

#### API expuesta

```js
const { state, history, talkMode, startListening, stopListening,
        toggleTalkMode, clearHistory, STATES } = useVoice()
```

### Animaciones GSAP

| Componente | Elemento | Animación | Trigger | Easing |
|---|---|---|---|---|
| `MicrophoneButton` | Anillo de pulso | `scale 1→1.6`, `opacity→0`, repetir infinito | `pulse=true` | `power2.out` |
| `MicrophoneButton` | Borde del anillo | `borderColor` → color del estado | Cambio de estado | `power2.out` (0.4s) |
| `MicrophoneButton` | Botón | `scale` + `backgroundColor` → estado | Cambio de estado | `elastic.out(1, 0.5)` (0.4s) |
| `MicrophoneButton` | Botón | `fromTo scale 0.85→1` rebote | Click | `elastic.out(1, 0.4)` (0.3s) |
| `VoiceIndicator` | 8 barras | `height` aleatoria, yoyo infinito, stagger | `state ≠ idle` | `power2.inOut` |
| `VoiceIndicator` | 8 barras | `height → 16px` | `state = idle` | — (0.3s) |
| `VoiceIndicator` | Etiqueta | `opacity 0→1`, `y 5→0` | Cada render | — (0.3s) |
| `TalkModeToggle` | Knob | `x: 0 ↔ 24px` | Toggle | `power2.inOut` (0.3s) |
| `TalkModeToggle` | Track | `backgroundColor: gris ↔ verde` | Toggle | — (0.3s) |
| `ChatHistory` | Último `.chat-item` | `opacity 0→1`, `x -10→0` | Nuevo mensaje | — (0.3s) |

## Principios SOLID aplicados

### Backend

#### S — Single Responsibility (Responsabilidad Única)

Cada módulo tiene una única razón para cambiar:
- `config.py`: solo carga configuración
- `requests.py`: solo define schemas de validación
- `ares_service.py`: solo lógica de comunicación con el LLM
- `tts_service.py`: solo lógica de síntesis de voz
- `ask.py` / `tts.py`: solo exponen endpoints HTTP y delegación

#### O — Open/Closed (Abierto/Cerrado)

Las clases base abstractas (`AresService`, `TtsService`, `SttService`) están abiertas a extensión pero cerradas a modificación. Para añadir un nuevo proveedor de LLM (ej. OpenAI, Claude), basta con crear una nueva clase que herede de `AresService` sin tocar el código existente.

#### L — Liskov Substitution (Sustitución de Liskov)

Cualquier subclase de `AresService` puede sustituir a `HttpAresService` sin romper el comportamiento de los routers. El contrato de la interfaz (`ask(prompt, history) -> str`) se cumple en todas las implementaciones.

#### I — Interface Segregation (Segregación de Interfaces)

Las interfaces son mínimas y específicas:
- `AresService`: solo `ask()`
- `TtsService`: solo `synthesize()`
- `SttService`: solo `transcribe()`

Ningún cliente depende de métodos que no usa.

#### D — Dependency Inversion (Inversión de Dependencias)

Los routers (módulos de alto nivel) dependen de abstracciones, no de implementaciones concretas. La inyección se resuelve en `main.py`:

```python
app.dependency_overrides = {
    ask.get_ares_service: get_ares_service,
    tts.get_tts_service: get_tts_service,
}
```

### Frontend

#### S — Single Responsibility

- `voiceService.js`: solo es un cliente HTTP (fetch a `/api/ask` y `/api/tts`)
- `useVoice.js`: solo gestiona la máquina de estados del pipeline de voz
- Cada componente (`MicrophoneButton`, `VoiceIndicator`, etc.): una sola responsabilidad visual

#### D — Dependency Inversion

`useVoice` depende de `voiceService` como abstracción de la capa de red. Si se cambiara la API (ej. WebSockets en lugar de REST), solo habría que modificar `voiceService.js`, no el hook ni los componentes.

## Cómo añadir SQLite (historial de conversaciones)

Para persistir el historial de conversaciones entre sesiones:

### 1. Añadir dependencia (backend)

```bash
# No se necesita paquete extra, sqlite3 viene en la stdlib de Python
```

### 2. Crear módulo de base de datos

**`backend/app/services/db_service.py`:**

```python
import sqlite3
import json
from datetime import datetime

DB_PATH = "ares_history.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_message(role, content):
    conn = get_db()
    conn.execute(
        "INSERT INTO conversations (role, content) VALUES (?, ?)",
        (role, content)
    )
    conn.commit()
    conn.close()

def get_history(limit=50):
    conn = get_db()
    rows = conn.execute(
        "SELECT role, content FROM conversations ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]

def clear_history():
    conn = get_db()
    conn.execute("DELETE FROM conversations")
    conn.commit()
    conn.close()
```

### 3. Inicializar en el arranque

En `backend/app/main.py`, añadir al evento `startup`:

```python
from app.services.db_service import init_db

@app.on_event("startup")
async def startup():
    init_db()
```

### 4. Nuevos endpoints

**`backend/app/routers/history.py`:**

```python
from fastapi import APIRouter
from app.services.db_service import get_history, clear_history

router = APIRouter(prefix="/api")

@router.get("/history")
async def read_history(limit: int = 50):
    return {"history": get_history(limit)}

@router.delete("/history")
async def delete_history():
    clear_history()
    return {"status": "ok"}
```

### 5. Guardar mensajes desde `/api/ask`

Modificar `backend/app/routers/ask.py` para persistir cada interacción:

```python
from app.services.db_service import save_message

@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, service: AresService = Depends(get_ares_service)):
    save_message("user", request.prompt)
    response = await service.ask(request.prompt, request.history)
    save_message("assistant", response)
    return AskResponse(response=response, model=settings.ares_model)
```

### 6. Cargar historial en el frontend

Añadir un endpoint en `voiceService.js` y llamarlo al montar `App.jsx` para precargar el historial anterior.

## Desarrollo

### Requisitos

| Herramienta | Versión mínima |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |
| Ollama | (debe estar corriendo con `llama3.2`) |

### Instalación

```bash
# Instalar dependencias de frontend y backend
npm run install:all

# O manualmente:
cd backend && pip3 install -r requirements.txt
cd ../frontend && npm install
```

### Arranque

```bash
# Arranca backend (:8000) y frontend (:5173) en paralelo
npm run dev

# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:frontend
```

### Variables de entorno

Copiar `backend/.env.example` a `backend/.env` y ajustar valores:

| Variable | Default | Descripción |
|---|---|---|
| `HOST` | `0.0.0.0` | Host del servidor |
| `PORT` | `8000` | Puerto del servidor |
| `DEBUG` | `true` | Modo debug |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Orígenes permitidos (separados por coma) |
| `ARES_API_URL` | `http://localhost:11434/api/generate` | Endpoint de Ollama |
| `ARES_MODEL` | `llama3.2` | Modelo de Ollama a usar |
| `ARES_SYSTEM_PROMPT` | (ver .env.example) | System prompt para el LLM |
| `TTS_VOICE` | `es-MX-DaliaNeural` | Voz de Edge-TTS |
| `TTS_LANG` | `es` | Idioma para TTS |

### Build de producción

```bash
cd frontend && npm run build     # Genera dist/
cd ../backend && python server.py # O usar gunicorn + uvicorn workers
```

Servir la carpeta `frontend/dist/` con Nginx o similar, apuntando `/api` al backend.
