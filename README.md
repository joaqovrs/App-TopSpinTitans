<div align="center">

# 🏓 Top Spin Titans

### App móvil de la liga estudiantil de tenis de mesa

*Ranking en vivo · Retos en tiempo real · Formato todos contra todos*

<br/>

![Expo](https://img.shields.io/badge/Expo-56-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.85-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

---

## 📖 ¿Qué es?

**Top Spin Titans** es la aplicación móvil de una liga competitiva de tenis de mesa estudiantil que se juega en formato **round-robin** (todos contra todos): cada jugador enfrenta una única vez a cada rival a lo largo de la temporada.

La app es **privada para los jugadores** y se conecta a un backend en **Supabase** donde vive toda la lógica de negocio. Desde el teléfono, cada jugador puede retar a otros, cargar resultados, validar los de sus rivales y seguir el ranking en tiempo real.

> 🔒 **Regla de oro del proyecto:** toda la lógica de negocio se ejecuta en el backend mediante funciones RPC de Postgres. La app **solo muestra datos y llama funciones** — nunca escribe directo en la base.

---

## ✨ Funcionalidades

| | Funcionalidad | Descripción |
|---|---|---|
| 🏠 | **Inicio** | Tu posición en la liga, notificaciones de acciones pendientes, partidos en vivo y tus últimos resultados. |
| ⚔️ | **Retos en tiempo real** | Desafiá a otros jugadores. Las invitaciones, aceptaciones y resultados se actualizan al instante (Supabase Realtime). |
| ✅ | **Doble validación** | Un jugador carga el resultado y el oponente debe confirmarlo antes de que cuente. |
| 🏆 | **Ranking en vivo** | Podio de los 3 primeros + lista completa. Se calcula al vuelo desde el backend, solo con partidos validados de la temporada activa. |
| 🔥 | **Racha "en llamas"** | Los jugadores con 3+ victorias seguidas se destacan con un efecto de fuego animado. |
| 📊 | **Historial** | Todos tus partidos finalizados con sus marcadores. |
| 👤 | **Perfil** | Editá tu nombre y foto, y accedé al panel si sos admin. |
| 🛡️ | **Panel de administrador** | Aprobación de jugadores y gestión de temporadas (oculto para jugadores normales). |
| 📲 | **Tarjetas para compartir** | Generá imágenes de tus resultados para compartir. |

---

## 🎯 Reglas de negocio

- 🚫 **Sin revanchas:** un par de jugadores se enfrenta una sola vez por temporada.
- 🥇 **Puntaje:** 3 puntos por victoria, 0 por derrota. Cuenta el partido completo (no por sets).
- 🙋 **Admisión manual:** un usuario registrado necesita la aprobación de un administrador antes de poder competir.
- 📈 **Ranking dinámico:** no se almacena; se calcula desde una vista del backend usando únicamente los partidos validados de la temporada activa.

### 🔄 Máquina de estados de un partido

```
disponible  →  invitado  →  aceptado  →  resultado pendiente  →  validado
            (reto)       (acepta)     (carga marcador)       (rival confirma)
```

---

## 🛠️ Stack tecnológico

- **[Expo](https://docs.expo.dev/) 56** + **React Native 0.85** + **React 19**
- **[Expo Router](https://docs.expo.dev/router/introduction)** — navegación basada en archivos con rutas tipadas
- **[Supabase](https://supabase.com/)** — autenticación, base de datos Postgres, RPC y Realtime
- **TypeScript** en todo el proyecto
- **React Native Reanimated** + **Gesture Handler** — animaciones fluidas
- **[Inter](https://rsms.me/inter/)** como tipografía, tema oscuro
- Otros: `expo-image`, `expo-image-picker`, `expo-linear-gradient`, `react-native-svg`, `react-native-view-shot`, `react-native-confetti-cannon`

---

## 📁 Estructura del proyecto

```
.
├── src/
│   ├── app/                 # Pantallas (file-based routing de Expo Router)
│   │   ├── (auth)/          # Login, registro, verificación, recuperar contraseña
│   │   └── (app)/           # App con sesión: Inicio, Retos, Ranking, Historial, Perfil, Admin
│   ├── components/          # Componentes reutilizables (avatar, modales, share-card...)
│   ├── hooks/               # Lógica de datos (use-retos, use-inicio, use-live, use-realtime...)
│   ├── context/             # Contexto de autenticación
│   └── lib/                 # supabase, theme (design tokens), tipos del dominio
├── assets/                  # Imágenes, íconos y animaciones
├── app.json                 # Configuración de Expo
├── eas.json                 # Perfiles de build de EAS
└── .env.example             # Plantilla de variables de entorno
```

### 🧭 Navegación

La app tiene **5 pestañas inferiores**: `Inicio` · `Retos` · `Ranking` · `Historial` · `Perfil`. El **panel de admin** no aparece en la barra y se accede desde el Perfil (solo administradores).

---

## 🚀 Puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) (LTS)
- [EAS CLI](https://docs.expo.dev/eas/) → `npm install -g eas-cli`
- Una cuenta de [Expo](https://expo.dev/) y un proyecto de [Supabase](https://supabase.com/)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiá la plantilla y completá con los datos de tu proyecto Supabase (*Project Settings → API*):

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Crear el build de desarrollo

Esta app usa **librerías nativas**, por lo que necesita un *development build* (no funciona con Expo Go):

```bash
eas build --profile development --platform android
```

Instalá el APK resultante en tu dispositivo.

### 4. Levantar el servidor de desarrollo

```bash
npx expo start --dev-client
```

Abrí la app instalada y empezá a desarrollar. ✨

> 💡 Cada vez que agregás una librería con **código nativo** necesitás un nuevo build. Las librerías solo-JS las levanta Metro al instante.

---

## 🎨 Sistema de diseño

Tema **oscuro** con tipografía **Inter**. Tokens principales:

| Token | Color | Uso |
|---|---|---|
| `primary` | 🔴 `#E53734` | Acento principal (rojo) |
| `accent` | 🔵 `#00E1FF` | Acento secundario (cyan) |
| `win` | 🟢 `#2EB82E` | Victorias |
| `gold` / `silver` / `bronze` | 🥇🥈🥉 | Podio del ranking |
| `background` | ⬛ `#0D0D0D` | Fondo |

El diseño está basado en la maqueta del proyecto en **Base44**.

---

## 🏗️ Arquitectura

```
┌─────────────────┐         ┌──────────────────────────┐
│  App móvil       │  RPC /  │  Supabase (Postgres)     │
│  (este repo)     │ Realtime│  • Funciones RPC          │
│  React Native    │ ───────▶│  • Row Level Security     │
│  Solo lee / llama│         │  • Vistas (ranking, live) │
└─────────────────┘         └──────────────────────────┘
```

La app **nunca** hace escrituras directas a la base: todo pasa por funciones RPC, y las políticas de **Row Level Security (RLS)** garantizan que cada rol (anónimo, jugador, admin) solo vea y haga lo que le corresponde.

---

<div align="center">

Hecho con ❤️ y 🏓 para la liga **Top Spin Titans**

</div>
