# Handoff: Fix First-Message Race Condition (Emma AI Copilot)

**Fecha:** 2026-02-22 12:08 EST-5
**Autor:** Claude Opus 4.6 (sesión de debugging sistemático)

---

## Estado Actual

**Branch:** `fix/first-message-race-condition`
**Estado del código:** Cambios no commiteados en `src/components/ai/ai-copilot.tsx` (236 insertions, 182 deletions)
**Branch hygiene:** Esta branch tiene 2 commits ya mergeados en main via PR #51 (squash). **Se DEBE crear una nueva branch desde `origin/main` antes de crear PR.** No reusar esta branch.

---

## El Bug

**Síntoma:** El primer mensaje en una nueva conversación de Emma no recibe respuesta. El usuario tiene que enviar un segundo mensaje para que Emma responda.

**Verificado con:** Screenshots del usuario en producción mostrando el comportamiento consistente. El servidor funciona correctamente (verificado con [AI:DIAG] logs en EC2).

---

## Root Cause (Verificado contra source code del AI SDK v6)

### Cadena causal trazada en source code

```
src/components/ai/ai-copilot.tsx
  handleSend() → crea conversación → setCurrentConversationId(conv.id)
    ↓ re-render
  useChat({ id: currentConversationId }) ← id cambia de undefined a conv.id
    ↓
node_modules/@ai-sdk/react/dist/index.mjs, línea 185:
  const shouldRecreateChat = "id" in options && chatRef.current.id !== options.id
    ↓ shouldRecreateChat === true
  chatRef.current = new Chat(optionsWithCallbacks)  ← línea 187
    ↓
node_modules/@ai-sdk/react/dist/index.mjs, líneas 122-124:
  class Chat extends AbstractChat {
    constructor({ messages, ...init }) {
      const state = new ReactChatState(messages)  ← messages = initialMessages = []
    ↓
  RESULTADO: Chat instance recreada con messages vacíos → respuesta streameada se pierde
```

### Contrato del hook `useChat` (documentación oficial)

La documentación de AI SDK v6 en `ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence` muestra que `id` se recibe como **prop estático** desde un componente padre:

```tsx
// Patrón documentado: id viene de route params (Server Component)
export default async function Page({ params }) {
  const { id } = await params;
  return <Chat id={id} initialMessages={await loadChat(id)} />;
}

// Client Component: id NUNCA cambia
export default function Chat({ id, initialMessages }) {
  useChat({ id, messages: initialMessages, transport });
}
```

El cambio de conversación se maneja con **navegación** (ruta `/chat/[id]`), que causa un remount completo. **El id de useChat nunca fue diseñado para cambiar dinámicamente.**

### Intentos previos fallidos (4 fixes)

| # | Fix | Por qué falló |
|---|-----|---------------|
| 1 | `skipDuplicates` en persistencia P2002 | No era el problema — era síntoma no causa |
| 2 | Upgrade modelo 4.5 → 4.6 | Irrelevante — problema es client-side |
| 3 | Remover sufijo de fecha del model ID | Irrelevante — problema es client-side |
| 4 | `pendingConversationIdRef` (PR #51) | Insuficiente — defer a `onFinish` solo retrasa el cambio de id, pero onFinish eventualmente lo cambia y recrea el Chat |

Todos trataron síntomas, no la causa raíz arquitectónica.

---

## Solución Propuesta (Implementada, No Commiteada)

### Arquitectura: Wrapper + ChatSession con React key

Replica el patrón documentado (id estático) sin usar rutas:

```
AICopilot (wrapper)
├── Header (dropdown conversaciones, botones)
├── ChatSession key={conversationId ?? 'new'}   ← React key fuerza remount
│   └── useChat({ id: conversationId })          ← id ESTÁTICO por componente
└── Input (textarea, botón enviar)
```

**`AICopilot`** (wrapper): Posee estado de conversación, header, input. Maneja creación de conversaciones y delegación de envío.

**`ChatSession`** (inner): Recibe `conversationId` como prop estático. `useChat` recibe ese id y **nunca cambia** durante la vida del componente. Cuando la conversación cambia, React desmonta la instancia y monta una nueva.

### Flujo del primer mensaje (nuevo)

```
1. Usuario escribe "hola" → handleSend() en AICopilot
2. currentConversationId === null → createConversation(fundId)
3. setPendingFirstMessage("hola") + setCurrentConversationId(conv.id)
4. React re-render: key cambia 'new' → conv.id
5. ChatSession anterior: unmount
6. ChatSession nueva: mount con conversationId=conv.id (ESTÁTICO)
7. useChat({ id: conv.id, messages: [] }) — Chat instance creada una sola vez
8. messagesLoaded === true (sin conversationId previo, no hay mensajes que cargar)
9. firstMessage useEffect ejecuta: sendMessage({ text: "hola" })
10. Stream empieza → respuesta llega → id NUNCA cambia → Chat NUNCA se recrea
```

### Flujo de mensaje subsiguiente (conversación existente)

```
1. Usuario escribe "cuéntame del pipeline" → handleSend()
2. currentConversationId !== null → sendRequestRef.current("cuéntame del pipeline")
3. ChatSession.sendMessage({ text }) via ref bridge
4. Stream directo — sin cambio de id, sin recreación
```

---

## Correcciones del Code Review

Se ejecutó un code review automatizado que encontró 3 issues. Todos corregidos:

### 1. Callbacks no memoizados (Confidence 95%)
**Problema:** `onStreamingChange` y `onFirstMessageConsumed` se pasaban como funciones inline → recreación en cada render → re-ejecución innecesaria de useEffects en ChatSession.
**Fix:** Wrapped en `useCallback` en el wrapper.

### 2. Race condition: first message vs load messages (Confidence 85%)
**Problema:** `loadMessages` y `sendFirstMessage` son dos useEffects que compiten al montar ChatSession con un nuevo `conversationId` + `firstMessage`. React no garantiza orden.
**Fix:** Estado `messagesLoaded` que actúa como gate: `useState(!conversationId)` — true inmediatamente para conversaciones nuevas (nada que cargar), true después de `getConversationMessages()` para existentes.

### 3. `status` innecesario en deps de sendRequestRef (Confidence 80%)
**Problema:** `status` como dependencia causa 3-4 re-ejecuciones del useEffect por ciclo de mensaje (ready → submitted → streaming → ready).
**Fix:** Removido `status` de deps. El parent ya protege con `disabled={isStreaming}` en el botón.

---

## Archivo Modificado

`src/components/ai/ai-copilot.tsx` — Reescritura completa (444 líneas):
- Líneas 33-260: `AICopilot` (wrapper) — header, input, state management
- Líneas 263-443: `ChatSession` (inner) — useChat con id estático, message display

**Ningún otro archivo necesita cambios.** El provider (`ai-copilot-provider.tsx`), toggle (`ai-toggle.tsx`), API route (`route.ts`), y system prompt (`system-prompt.ts`) permanecen intactos.

---

## Pasos Pendientes (Next Steps)

### 1. Build verification
```bash
# Desde el repo principal (tiene node_modules):
cd /Users/rodolfofarias/Desktop/BlackGem
cp .claude/worktrees/nostalgic-tereshkova/src/components/ai/ai-copilot.tsx src/components/ai/ai-copilot.tsx
npm run build
npm run lint
```
El build fue lanzado pero no completó antes de la interrupción. **Se debe verificar que pasa sin errores TypeScript.**

### 2. Branch hygiene (OBLIGATORIO por CLAUDE.md)
```bash
# Esta branch tiene ghost commits de PR #51. NO reusar.
git fetch origin main
git checkout -b fix/emma-first-message-architecture origin/main
# Copiar el archivo modificado
cp .claude/worktrees/nostalgic-tereshkova/src/components/ai/ai-copilot.tsx src/components/ai/ai-copilot.tsx
git add src/components/ai/ai-copilot.tsx
git commit -m "Fix first-message race condition via static useChat id architecture"
```

### 3. Crear PR
- Título: `Fix first-message race condition via static useChat id architecture`
- Referencia a la documentación de AI SDK v6 (chatbot-message-persistence)
- Explica por qué las 4 fixes anteriores fallaron

### 4. Deploy y verificación manual
- Merge PR
- Deploy via GitHub Actions
- Verificar en producción:
  - Abrir Emma → enviar primer mensaje → debe recibir respuesta inmediata
  - Enviar segundo mensaje en misma conversación → debe funcionar
  - Cambiar conversación → mensajes anteriores cargan correctamente
  - Crear nueva conversación → primer mensaje funciona

---

## Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `src/components/ai/ai-copilot.tsx` | Componente modificado (archivo principal del fix) |
| `src/components/ai/ai-copilot-provider.tsx` | Provider de estado (no modificado) |
| `src/components/ai/ai-toggle.tsx` | Toggle button (no modificado) |
| `src/app/api/chat/route.ts` | API route (no modificado) |
| `node_modules/@ai-sdk/react/dist/index.mjs:185` | Source code de shouldRecreateChat |
| `node_modules/ai/dist/index.mjs:12611` | Source code de AbstractChat/Chat class |

## Source Code de Referencia del AI SDK

### useChat hook — línea 185 (root cause)
```javascript
// @ai-sdk/react/dist/index.mjs
const chatRef = useRef(
  "chat" in options ? options.chat : new Chat(optionsWithCallbacks)
);
const shouldRecreateChat = "id" in options && chatRef.current.id !== options.id;
if (shouldRecreateChat) {
  chatRef.current = "chat" in options ? options.chat : new Chat(optionsWithCallbacks);
}
```

### Chat class — líneas 122-124
```javascript
// @ai-sdk/react/dist/index.mjs
var Chat = class extends AbstractChat {
  constructor({ messages, ...init }) {
    const state = new ReactChatState(messages);  // messages = [] para nueva conv
    super({ ...init, state });
  }
};
```

### ReactChatState — línea 88
```javascript
// @ai-sdk/react/dist/index.mjs
__privateSet(this, _messages, initialMessages);  // messages se copia al state nuevo
```
