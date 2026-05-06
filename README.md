# 🤟 SeñasApp — Traductor de Texto a Lengua de Señas

Web app mobile-first que convierte texto escrito en reproducción secuencial de videos de lengua de señas.

## 🚀 Cómo Correr el Proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar tus videos a la carpeta pública
# Los videos deben estar en: public/videos/
# Ejemplo: public/videos/Hola.mp4, public/videos/A.mp4, etc.

# 3. Iniciar el servidor de desarrollo
npm run dev

# La app estará disponible en http://localhost:5173/
```

## 📁 Estructura del Proyecto

```
app_traduccion/
├── public/
│   ├── manifest.json        ← Configuración de assets (mapeo de tokens a videos)
│   └── videos/              ← Todos los .mp4 van aquí
│       ├── A.mp4
│       ├── Hola.mp4
│       ├── Buenos días.mp4
│       └── ...
├── src/
│   ├── engine/
│   │   ├── manifest.ts      ← Carga y búsqueda en el manifest
│   │   ├── normalizer.ts    ← Normalización de texto (acentos, mayúsculas)
│   │   └── translator.ts    ← Motor de traducción principal
│   ├── hooks/
│   │   ├── usePlayback.ts   ← Hook de reproducción secuencial
│   │   └── useTranslation.ts← Hook de traducción
│   ├── components/
│   │   ├── TextInput/        ← Input de texto + botones
│   │   ├── VideoPlayer/      ← Reproductor de video con controles
│   │   ├── PlaybackQueue/    ← Cola visual de secuencia
│   │   ├── SpeedControl/     ← Control de velocidad
│   │   └── StatusIndicator/  ← Indicador de estado
│   ├── types/
│   │   └── index.ts          ← Tipos TypeScript
│   ├── App.tsx               ← Componente principal
│   ├── App.css               ← Estilos del layout
│   ├── index.css             ← Design system global
│   └── main.tsx              ← Entry point
└── README.md
```

## 📹 Cómo Agregar Nuevos Videos

### Paso 1: Coloca el archivo de video
Copia el archivo `.mp4` a `public/videos/`. El nombre debe ser descriptivo:
- Letra: `A.mp4`, `B.mp4`, etc.
- Palabra: `Gracias.mp4`, `Ayuda.mp4`
- Frase: `Buenas noches.mp4`, `Con permiso.mp4`

### Paso 2: Actualiza el manifest
Edita `public/manifest.json` y agrega la entrada correspondiente:

```json
{
  "tokens": {
    "phrases": {
      "buenas noches": "Buenas Noches.mp4",
      "con permiso": "Con permiso.mp4"
    },
    "words": {
      "gracias": "Gracias.mp4",
      "ayuda": "Ayuda.mp4"
    },
    "letters": {
      "j": "J.mp4"
    }
  }
}
```

**Reglas para las claves del manifest:**
- Siempre en **minúsculas**
- **Sin acentos** (para búsqueda normalizada)
- Sin signos de puntuación
- El valor (filename) debe ser el **nombre exacto** del archivo

### Paso 3: Listo
No necesitas reiniciar el servidor. Recarga la página y el nuevo video estará disponible.

## 🔄 Prioridad de Traducción

Cuando escribes un texto, el motor lo resuelve en este orden:

| Prioridad | Tipo | Ejemplo |
|-----------|------|---------|
| 1️⃣ | **Frase completa** | "buenos días" → `Buenos días.mp4` |
| 2️⃣ | **Palabra individual** | "hola" → `Hola.mp4` |
| 3️⃣ | **Letras** | "xyz" → `X.mp4` + `Y.mp4` + `Z.mp4` |
| 4️⃣ | **Missing** | Carácter sin video → indicador visual |

### Ejemplo detallado
Input: `"Hola, ¿cómo estás?"`

1. `"hola"` → tiene asset de palabra → `Hola.mp4` ✅
2. `"como"` → NO tiene asset → deletrear: `C.mp4 + O.mp4 + M.mp4 + O.mp4` (⚠️ M no tiene video = missing)
3. `"estas"` → NO tiene asset → deletrear: `E.mp4 + S.mp4 + T.mp4 + A.mp4 + S.mp4` ✅

## ⚠️ Videos Faltantes Conocidos

Las siguientes letras **no tienen video** actualmente:
- **J, K, L, M, N, Ñ**

Cuando una palabra contiene estas letras y no tiene asset propio, la app mostrará un indicador de "sin video" para esas letras específicas.

## 🎮 Controles de la App

| Control | Función |
|---------|---------|
| ▶ Reproducir | Traduce y reproduce el texto |
| ✕ Limpiar | Borra el texto y detiene la reproducción |
| ⏸ Pausa | Pausa la reproducción actual |
| ⏹ Detener | Detiene y reinicia la reproducción |
| 🔄 Repetir | Reproduce de nuevo desde el inicio |
| Velocidad (0.5x-1.5x) | Ajusta el delay entre clips |

## 🛠 Stack Tecnológico

- **Vite** + **React** + **TypeScript**
- **CSS Modules** (vanilla CSS)
- **Diseño mobile-first** (optimizado para 375px)
- **Modo oscuro** por defecto

## 📋 Notas Técnicas

- Los videos se sirven como archivos estáticos desde `public/videos/`
- El manifest se carga una sola vez y se cachea en memoria
- La normalización de texto maneja: acentos, mayúsculas, signos de puntuación, espacios dobles
- Los espacios entre palabras se convierten en pausas breves en la reproducción
- El sistema usa un algoritmo greedy de longest-match para frases
