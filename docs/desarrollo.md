# Desarrollo

## Metodología de Investigación

El desarrollo de este proyecto siguió una metodología iterativa e incremental, combinando investigación aplicada con ciclos de prueba-error-corrección. Se utilizó un enfoque de ingeniería de software pragmático, priorizando la funcionalidad sobre la perfección, dado el contexto de proyecto individual con recursos limitados.

La investigación se estructuró en tres fases principales:
1. **Fase diagnóstica**: Investigación de las capacidades y limitaciones del entorno Moodle.
2. **Fase de diseño**: Arquitectura del sistema bajo la restricción de costo cero.
3. **Fase de implementación**: Desarrollo iterativo con validación continua.

---

## Descripción de la Arquitectura del Sistema

### Diseño "Link-Out"

La restricción más determinante del proyecto fue la incapacidad de ejecutar JavaScript o incrustar iframes en el entorno Moodle del estudiante. La solución fue adoptar una arquitectura de **"link-out"** (enlace externo): en lugar de intentar ejecutar código dentro de Moodle, el sistema simplemente presenta un elemento HTML compatible (un `<div>` estilizado con CSS inline) que actúa como lanzador y abre el panel web completo en una nueva pestaña del navegador.

Esta arquitectura tiene varias ventajas:
- **Compatibilidad total**: No requiere ningún privilegio elevado en Moodle.
- **Separación de responsabilidades**: Moodle permanece como portal de acceso; toda la lógica reside en el servidor local.
- **Seguridad**: El sistema de seguridad de Moodle no ve comprometido, ya que no se inyecta código ejecutable.

### Componentes del Sistema

El sistema se compone de cinco componentes principales interconectados:

**1. Lanzador Moodle (HTML/CSS inline)**
Un bloque de texto HTML pegado en el tablero de Moodle del estudiante. Usa únicamente etiquetas permitidas (`<div>`, `<a>`, `<img>`) con estilos CSS inline, evitando las etiquetas filtradas (`<script>`, `<iframe>`, `<style>` externo). El lanzador muestra un badge de estado obtenido como imagen SVG del servidor local.

**2. Servidor Express.js (Node.js)**
El núcleo del sistema. Expuesto a internet mediante Cloudflare Tunnel, gestiona:
- Autenticación por API key en todas las rutas protegidas
- Enrutamiento de solicitudes de chat al AI (Ollama o Gemini)
- Persistencia de conversaciones en PostgreSQL
- Exportación de resultados a Google Sheets
- Servicio del panel web estático

**3. Motor de IA Local (Ollama + Mistral 7B)**
Ollama proporciona una API compatible con OpenAI para modelos de lenguaje que se ejecutan completamente en hardware local. El modelo Mistral 7B fue seleccionado por su balance óptimo entre capacidad de razonamiento, requerimientos de hardware (4 GB en cuantización Q4) y calidad de respuestas en español.

**4. Capa de Persistencia (PostgreSQL)**
Base de datos relacional para almacenar sesiones, mensajes, exportaciones y datos de entrenamiento. El diseño de esquema incluye una vista `training_pairs` que facilita la exportación de datos para fine-tuning.

**5. Panel Web (SPA)**
Aplicación de página única (Single-Page Application) servida por Express. Integra TinyMCE como editor de texto enriquecido, Mermaid.js para renderizado de diagramas, y Chart.js para visualización de estadísticas de entrenamiento.

---

## Tecnologías Seleccionadas y Justificación

### Ollama + Mistral 7B
**Justificación**: Ollama fue seleccionado por proporcionar inferencia local de LLMs con zero configuración, soporte de API compatible con OpenAI (facilitando migración futura), y soporte para modelos cuantizados que permiten ejecución en hardware de consumo. Mistral 7B-Instruct fue elegido sobre alternativas como LLaMA 2 por su superior rendimiento en español y tamaño más manejable.

### Node.js + Express.js
**Justificación**: El ecosistema JavaScript permite usar el mismo lenguaje en el backend y el frontend del panel web. Express.js es minimalista pero extensible, con amplia documentación y bajo overhead. La selección de módulos ES (ESM) moderno asegura compatibilidad futura.

### PostgreSQL
**Justificación**: Sistema de gestión de bases de datos relacional de código abierto con soporte robusto para tipos de datos complejos, transacciones ACID, y escalabilidad. La funcionalidad de vistas (VIEW) facilita la lógica de consultas complejas para training_pairs.

### Cloudflare Tunnel
**Justificación**: Proporciona exposición HTTPS segura del servidor local sin requerir IP pública, configuración de router, ni redirección de puertos. El plan gratuito incluye protección DDoS, sin límites de ancho de banda, y certificados TLS automáticos.

---

## Fases de Implementación

### Fase 1: Diagnóstico Moodle (Semana 1)
Se ejecutaron 15 pruebas HTML diagnósticas para determinar qué elementos permite el sistema de sanitización de Moodle. Los resultados confirmaron: divs con CSS inline ✅, links con target="_blank" ✅, imágenes externas ✅, scripts ❌, iframes ❌, etiquetas style ❌. Esto validó la viabilidad del diseño link-out.

### Fase 2: Infraestructura (Semanas 2-3)
Instalación y configuración de: Ollama + Mistral, PostgreSQL (schema y migraciones), Cloudflare Tunnel, y servidor Express básico.

### Fase 3: Funcionalidades Core (Semanas 3-4)
Implementación de las rutas de API principales: `/api/chat` (con prompt APA, fallback Gemini), `/api/status` (badges SVG), y el panel web con TinyMCE y burbujas de chat.

### Fase 4: Exportación e Integración (Semana 5-6)
Integración con Google Sheets API v4 via cuenta de servicio. Parser de secciones académicas (regex para Introducción/Desarrollo/Conclusión/Referencias). Renderizado de diagramas Mermaid.js en el panel.

### Fase 5: Pipeline de Entrenamiento (Semana 7)
Implementación de botones de calificación (👍/👎) y editor de correcciones inline. Script de exportación JSONL y script Python de fine-tuning con LoRA (PEFT).

---

## Enfoque de Entrenamiento con Intervención Humana

El sistema implementa un ciclo de mejora continua denominado **Human-in-the-Loop (HITL)**:

1. El estudiante usa el sistema normalmente para tareas escolares.
2. Cuando el AI produce una respuesta subóptima, el estudiante la califica negativamente (👎) y proporciona una versión corregida.
3. Las correcciones se almacenan en PostgreSQL con el prompt original asociado.
4. Periódicamente, los pares instrucción-corrección se exportan como JSONL.
5. El script `finetune-lora.py` usa LoRA (Low-Rank Adaptation) para ajustar Mistral con estos datos.
6. El modelo ajustado se importa en Ollama y reemplaza al modelo base.

Este ciclo convierte cada uso del sistema en una oportunidad de mejora, personalizando el modelo a las necesidades específicas del estudiante.

---

## Consideraciones de Seguridad

La seguridad fue una prioridad del diseño, implementando múltiples capas:

- **Autenticación por API Key**: Todas las rutas de `/api/*` excepto `/api/status` requieren el header `X-API-KEY` con la clave secreta del archivo `.env`.
- **HTTPS obligatorio**: Cloudflare Tunnel encripta todo el tráfico con TLS 1.3 automáticamente.
- **Sin puertos expuestos**: El servidor solo escucha en `localhost:3000`. El túnel de Cloudflare elimina la necesidad de abrir puertos en el router.
- **Consultas parametrizadas**: Todo acceso a PostgreSQL usa consultas parametrizadas (`$1, $2...`) para prevenir inyección SQL.
- **Secretos en variables de entorno**: Ninguna clave API o contraseña está hardcodeada en el código. El archivo `.env` está en `.gitignore`.

---

## Metodología de Pruebas

Se implementó una estrategia de pruebas en tres niveles:

**Pruebas unitarias funcionales**: Cada endpoint de API fue probado individualmente con `curl` verificando respuestas correctas para casos felices y casos de error.

**Pruebas de integración**: El flujo completo fue probado: panel web → API → Ollama → PostgreSQL → respuesta al usuario.

**Pruebas de compatibilidad Moodle**: Los 15 tests diagnósticos (`moodle-snippet/diagnostic-tests.html`) verificaron la compatibilidad HTML del lanzador con el entorno Moodle específico.
