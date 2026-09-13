# Centro Deportivo Zona 8

Aplicación móvil en React Native con Expo SDK 54 y JavaScript para gestionar reservas del centro deportivo.

## Arquitectura del taller

- `components/`: controles visuales reutilizables, como `StatusBadge`.
- `context/`: sesión persistida con SecureStore y conectividad con NetInfo.
- `database/`: inicialización, repositorio SQLite y cola de operaciones pendientes.
- `navigation/`: flujo público, Drawer, Bottom Tabs y Stack de detalle.
- `screens/`: login, inicio, reservas, detalle, canchas y perfil.
- `services/`: API HTTP basada en DummyJSON y sincronización.
- `utils/`: validaciones compartidas de reservas y conversión de horarios.
- `constants/`: colores, espaciado y valores visuales compartidos.

La entidad `reserva` se adapta al recurso `/posts`: listado `GET /posts`, detalle `GET /posts/{id}`, alta `POST /posts/add`, edición `PATCH /posts/{id}`, eliminación `DELETE /posts/{id}`, login `POST /auth/login` y sesión `GET /auth/me`.

## Objetivo

La app permite:

- controlar reservas de cancha,
- evitar cruces de horarios,
- registrar anticipos,
- revisar ocupación por cancha,
- centralizar la información que hoy se reparte entre WhatsApp y agenda física.

## Estructura

- [src/screens](src/screens): pantallas de inicio, reservas, canchas y perfil
- [src/services](src/services): reglas de negocio de reservas
- [src/components](src/components): componentes reutilizables
- [src/utils](src/utils): validaciones y utilidades
- [src/constants](src/constants): constantes visuales y de configuración

## Ejecutar el proyecto

1. Instalar dependencias:

   ```bash
   cd "/Users/Fabi/React_Native"
   npm install
   ```

2. Iniciar la app:

   ```bash
   npx expo start
   ```

3. Opciones desde el terminal:
   - `a` para Android
   - `i` para iOS
   - `w` para web

## Compatibilidad con Expo Go

La aplicación está preparada para ejecutarse en Expo Go 54 para Android y iOS con Expo SDK 54. No usa módulos nativos personalizados ni requiere un development build. `expo-secure-store` y `expo-sqlite` se utilizan con sus APIs incluidas en Expo SDK.

Después de instalar dependencias, inicia el servidor con:

```bash
npx expo start
```

Escanea el código QR desde Expo Go. Para probar la versión web usa `npx expo start --web`; en web la sesión usa `localStorage`, mientras que en Android/iOS usa SecureStore.

## Probar la API y el modo offline

La API remota está en [src/services/api.js](src/services/api.js). La app siempre lee desde SQLite, de modo que puede mostrar reservas sin internet.

Para probar el modo offline, inicia sesión, activa modo avión, crea o cambia una reserva y verifica el indicador `Sin conexion`. La operación se guarda en `pending_operations`. Al recuperar conexión, NetInfo dispara la sincronización y se reintenta la cola.

Ejemplo rápido:

```bash
cd "/Users/Fabi/React_Native"
node -e "const { getReservas, createReserva } = require('./src/services/reservasApi.js'); console.log(getReservas()); console.log(createReserva({ cliente: 'Ana', cancha: 2, fecha: '2026-09-11', horaInicio: '18:00', horaFin: '19:00', estado: 'Pendiente', anticipo: 0, tipoCliente: 'Frecuente', observaciones: 'Prueba' }));"
```

## Pruebas

```bash
cd "/Users/Fabi/React_Native"
node --test src/services/reservasApi.test.js
```

Resultado verificado:

- 4 pruebas exitosas
- 0 fallas

## Conflictos y reglas

- No se permiten dos reservas para la misma cancha cuando los horarios se cruzan.
- Una reserva sin anticipo puede quedar pendiente.
- Las reservas sin anticipo se consideran sujetas a liberación según la regla del establecimiento.
- Los clientes frecuentes tienen excepción al anticipo.
- La información de anticipos queda visible en la app.
- Una reserva fija de empresa impide que otra reserva ocupe ese mismo horario.

La estrategia es last-write-wins para cambios aceptados por el servidor. Mientras no hay red, SQLite conserva la versión local y cada mutación se encola. Si el servidor rechaza una operación, la cola conserva el elemento para reintento y la interfaz mantiene el dato local; no se sobrescribe silenciosamente.
