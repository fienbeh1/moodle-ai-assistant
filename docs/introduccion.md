# Introducción

## Contexto: La Inteligencia Artificial en la Educación

En los últimos años, la inteligencia artificial (IA) ha transformado radicalmente múltiples industrias, y la educación no es la excepción. Herramientas como los Grandes Modelos de Lenguaje (LLMs, por sus siglas en inglés) han demostrado capacidad para asistir en la redacción, síntesis de información, generación de esquemas y resolución de problemas complejos. Sin embargo, el acceso a estas tecnologías suele estar condicionado a suscripciones de pago o a infraestructuras institucionales que no todos los estudiantes tienen disponibles.

La plataforma Moodle, ampliamente utilizada en instituciones educativas de nivel medio superior y superior en México y América Latina, proporciona a los estudiantes un entorno de aprendizaje gestionado (LMS, *Learning Management System*). No obstante, sus restricciones de seguridad —en particular el sistema de sanitización HTML denominado HTML Purifier— limitan significativamente las posibilidades de personalización para usuarios con acceso de estudiante, impidiendo la ejecución de scripts o la incrustación de iframes.

## Planteamiento del Problema

El presente proyecto surge de una necesidad concreta: un estudiante de nivel preparatoria requiere acceso a un asistente de IA para apoyar sus tareas académicas, con las siguientes restricciones específicas:

1. **Acceso limitado a Moodle**: solo se tiene acceso de estudiante, sin privilegios administrativos ni de instalación de plugins.
2. **Presupuesto nulo**: no se dispone de fondos para contratar servicios en la nube, APIs comerciales, o servidores externos.
3. **Restricciones técnicas del LMS**: Moodle filtra etiquetas HTML como `<script>` e `<iframe>`, haciendo inviables las soluciones convencionales de integración.
4. **Necesidades académicas específicas**: se requiere que el asistente produzca documentos con formato académico correcto, incluyendo referencias bibliográficas en formato APA 7ma edición.

Esta combinación de limitaciones técnicas y económicas representa un desafío real que afecta a miles de estudiantes en situaciones similares.

## Objetivo del Proyecto

El objetivo principal de este proyecto es **diseñar, implementar y documentar un sistema de asistencia académica con IA** que opere completamente bajo restricciones de presupuesto cero, integrable con el tablero de un estudiante en Moodle, y que cumpla con los siguientes objetivos específicos:

1. Crear un lanzador HTML compatible con las restricciones de HTML Purifier de Moodle que permita acceder al sistema desde el tablero del estudiante.
2. Implementar un servidor local que ejecute el modelo de lenguaje Mistral 7B mediante Ollama, proporcionando inferencia de IA sin costo y sin dependencia de la nube.
3. Estructurar automáticamente las respuestas del AI en formato académico (Introducción, Desarrollo, Conclusión y Referencias APA 7ma edición).
4. Integrar exportación directa a Google Sheets para facilitar la entrega de tareas.
5. Implementar un pipeline de mejora continua mediante retroalimentación humana (Human-in-the-Loop) que permita afinar el modelo con correcciones del usuario.

## Alcance y Limitaciones

### Alcance
- El sistema está diseñado para uso personal en la computadora del hogar del estudiante.
- Cubre materias de nivel preparatoria con respuestas en español e inglés.
- Funciona con conexión a internet para el acceso vía Cloudflare Tunnel.

### Limitaciones
- El modelo Mistral 7B tiene conocimiento limitado a su fecha de corte de entrenamiento (~principios de 2024).
- El rendimiento del modelo depende del hardware disponible (mínimo 8 GB RAM).
- La disponibilidad del servicio requiere que la computadora esté encendida.
- El fine-tuning local requiere hardware con GPU dedicada para tiempos razonables.

Este proyecto demuestra que las limitaciones económicas y técnicas no son un obstáculo insuperable para acceder a herramientas de IA modernas cuando se aplica creatividad e ingenio de programación.
