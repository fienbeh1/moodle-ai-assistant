# 📅 Cronograma — Proyecto Final 2026

## Cronograma del Proyecto: Asistente IA Académico para Moodle

**Duración total**: 8 semanas
**Inicio estimado**: Semana 1 del proyecto
**Entrega final**: Semana 8

---

## Semana 1 — Diagnóstico y Configuración Base de IA

**Objetivo**: Verificar qué HTML permite Moodle y levantar Ollama.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Pruebas diagnósticas | Ejecutar los 15 tests HTML en Moodle | Tabla de resultados completada |
| Instalación de Ollama | Instalar y configurar Ollama + Mistral 7B | Ollama respondiendo en localhost:11434 |
| Primer chat de prueba | Probar Mistral directamente vía curl | Primera respuesta en APA generada |
| Selección de launcher | Decidir qué launcher usar según tests | launcher-styled.html o launcher-basic.html |

**Milestone**: Ollama corriendo localmente, launcher elegido

---

## Semana 2 — Base de Datos y Túnel

**Objetivo**: Persistencia de conversaciones y acceso externo seguro.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Instalación PostgreSQL | Instalar, crear DB `moodle_ai` y usuario | DB accesible desde localhost |
| Ejecutar migraciones | Crear tablas sessions, messages, exports | Schema completo en PostgreSQL |
| Configurar Cloudflare Tunnel | Instalar cloudflared, crear túnel `moodle-bridge` | URL HTTPS funcionando |
| Prueba de conectividad | Verificar que el túnel responde | curl a https://ai.yourdomain.com |

**Milestone**: Base de datos lista, servidor accesible desde internet

---

## Semana 3 — Backend Express y Ruta de Chat

**Objetivo**: API REST funcional con chat AI.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Configurar Express.js | server.js con middleware básico | Servidor respondiendo en :3000 |
| Ruta /api/chat | Implementar chat con Ollama + fallback Gemini | Chat funcionando vía curl |
| Autenticación API Key | Middleware X-API-KEY en rutas protegidas | Rutas seguras |
| Guardar en PostgreSQL | Persistir sesiones y mensajes | Conversaciones guardadas en DB |

**Milestone**: `POST /api/chat` funcional y seguro

---

## Semana 4 — Panel Web y TinyMCE

**Objetivo**: Interfaz de usuario completa y usable.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Estructura HTML del panel | index.html con layout de 3 paneles | Panel visible en el navegador |
| Estilos CSS oscuros | styles.css con tema oscuro profesional | Panel con diseño final |
| Módulo de chat (JS) | chat.js con burbujas de mensajes | Chat funcionando en el panel |
| Editor TinyMCE | editor.js con TinyMCE inicializado | Editor de texto rico funcionando |
| Obtener API key TinyMCE | Registrarse en tiny.cloud | API key integrada |

**Milestone**: Panel web completo y chat funcionando

---

## Semana 5 — Exportación a Google Sheets

**Objetivo**: Exportar tareas completadas a Google Sheets.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Crear plantilla de Sheets | 5 pestañas: Portada, Intro, Desarrollo, Conclusión, Referencias | Template funcional |
| Service Account Google | Crear cuenta de servicio y key JSON | JSON key descargado |
| Ruta /api/export/sheets | sheets-exporter.js + route | Exportación funcionando |
| UI de exportación | Formulario en panel derecho | Formulario con botón de exportar |
| Prueba completa | Generar tarea, exportar, verificar en Sheets | Google Sheet con contenido APA |

**Milestone**: Tarea completa exportada a Google Sheets

---

## Semana 6 — Diagramas Mermaid

**Objetivo**: Visualización de conceptos con diagramas.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Prompt de diagramas | diagram-prompt.txt para pedir Mermaid al AI | Prompt probado |
| diagrams.js | Detectar y renderizar bloques Mermaid | Diagramas visibles en panel |
| Exportar PNG | Función exportAsPNG() | Diagramas descargables |
| Pruebas con temas escolares | Pedir diagramas de biología, historia, etc. | 3+ diagramas de ejemplo generados |

**Milestone**: Sistema de diagramas completo

---

## Semana 7 — Entrenamiento con Intervención Humana

**Objetivo**: Mejorar el modelo con retroalimentación real.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| training.js UI | Botones 👍/👎 y editor de correcciones | Interfaz de calificación |
| Ruta /api/training | Endpoints rate, correct, export-jsonl | API de entrenamiento |
| Acumular datos | Calificar y corregir respuestas reales | ≥50 pares de entrenamiento |
| Export JSONL | export-training-data.js funcionando | training-data.jsonl generado |
| Script LoRA (opcional) | finetune-lora.py si hay GPU disponible | Script documentado y probado |

**Milestone**: Pipeline de entrenamiento humano completo

---

## Semana 8 — Documentación y Presentación

**Objetivo**: Proyecto documentado y listo para entregar.

| Actividad | Descripción | Entregable |
|-----------|-------------|-----------|
| Documentación técnica | docs/ completo (portada, intro, desarrollo, conclusiones, refs APA) | 5 documentos MD |
| README actualizado | Screenshots, guía rápida final | README.md final |
| Video demo (opcional) | Grabación de 5 min mostrando el sistema | Video .mp4 |
| Presentación | Slides o demo en vivo | Presentación preparada |
| Revisión final | Prueba end-to-end completa | Sistema funcionando al 100% |

**Milestone**: Proyecto entregado 🎓

---

## Resumen de Milestones

```
Semana 1  ████████░░░░░░░░  Ollama corriendo + launcher elegido
Semana 2  ████████████████  DB + Túnel listos
Semana 3  ████████░░░░░░░░  API chat funcional
Semana 4  ████████████████  Panel web completo
Semana 5  ████████░░░░░░░░  Exportación Sheets
Semana 6  ████████████████  Diagramas Mermaid
Semana 7  ████████░░░░░░░░  Entrenamiento IA
Semana 8  ████████████████  Documentación y entrega 🎓
```
