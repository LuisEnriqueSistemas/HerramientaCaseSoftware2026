# Ejecutar el proyecto

El frontend y el backend son aplicaciones independientes. Cada uno debe instalarse y ejecutarse desde su propia carpeta.

## Desarrollo local

### 1. Configurar el backend

Crear o editar `servidor/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=db_case_2026
JWT_SECRET=clave_dev_cambiar_en_produccion
JWT_EXPIRES_IN=8h
JWT_SLIDE_WINDOW=30m
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
WHISPER_URL=http://localhost:9000/transcribe
```

### 2. Configurar el frontend

Crear o editar `cliente/.env.local`:

```env
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

`NEXT_PUBLIC_API_URL` se utiliza para las peticiones HTTP y la conexión Socket.IO.

### 2.1. Proveedor local de IA

Instalar Ollama y descargar el modelo configurado:

```bash
ollama pull qwen3:8b
```

Mantener Ollama ejecutándose localmente. El backend lo consulta mediante `OLLAMA_URL`.

Para usar audio, configurar además un servicio local compatible con `WHISPER_URL`. La respuesta debe ser JSON con una propiedad `text` o `transcription`.

La generación desde imagen no forma parte de esta versión.

### Exportación para Enterprise Architect

En la cabecera del diagrama se encuentran dos opciones:

- `Exportar EA XMI 1.1`: formato principal para importar el modelo y su diagrama visual en Enterprise Architect 15.2.
- `XSD`: formato de compatibilidad heredado basado en XML Schema.

El archivo EA XMI se descarga como `modelo-<projectId>.ea.xmi` y conserva clases, atributos, operaciones, visibilidad, relaciones, roles, multiplicidades y posiciones visuales.

### 3. Instalar dependencias

En una terminal:

```bash
cd servidor
npm install
```

En otra terminal:

```bash
cd cliente
npm install
```

### 4. Levantar las aplicaciones

Backend:

```bash
cd servidor
npm run start:dev
```

Frontend:

```bash
cd cliente
npm run dev
```

URLs esperadas:

- Frontend: `http://localhost:4000`
- Backend: `http://localhost:5000`

El script `dev` del frontend carga explícitamente `.env.local` antes de ejecutar Next.js.

## Verificación en desarrollo

```bash
cd cliente
npm test
npm run typecheck
npm run lint
npm run build
```

```bash
cd servidor
npm test -- --runInBand
npm run build
```

Si se cambian variables de entorno, detener y volver a iniciar ambos procesos.

## Producción o despliegue

No subir `servidor/.env` ni `cliente/.env.local` al repositorio. Configurar las variables directamente en la plataforma de despliegue, en Docker o en el servidor.

### Variables del backend

```env
NODE_ENV=production
PORT=<puerto asignado por la plataforma>
CLIENT_URL=https://app.ejemplo.com
DB_HOST=<host de PostgreSQL>
DB_PORT=5432
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
DB_NAME=<base de datos>
JWT_SECRET=<secreto seguro>
JWT_EXPIRES_IN=8h
JWT_SLIDE_WINDOW=30m
```

En producción `PORT` debe ser el valor proporcionado por la plataforma. No reemplazarlo por un puerto fijo.

### Variables del frontend

```env
PORT=<puerto asignado por la plataforma>
NEXT_PUBLIC_API_URL=https://api.ejemplo.com
```

`NEXT_PUBLIC_API_URL` debe existir antes de ejecutar el build, porque Next.js incorpora las variables públicas en el bundle.

### Build y ejecución del backend

```bash
cd servidor
npm install
npm run build
npm run start:prod
```

### Build y ejecución del frontend

```bash
cd cliente
npm install
npm run build
npm run start
```

La plataforma debe ejecutar el proceso de inicio y permitir que la aplicación lea `PORT` desde el entorno.

## Comprobaciones de despliegue

- El frontend responde en el dominio configurado.
- El backend responde en el dominio de API configurado.
- Las peticiones HTTP usan `NEXT_PUBLIC_API_URL`.
- Socket.IO conecta al mismo dominio de API.
- El backend acepta CORS únicamente desde `CLIENT_URL`.
- No aparecen peticiones a `localhost`, `3000` o `3001` en producción.
- Las variables de producción no contienen contraseñas dentro del repositorio.
