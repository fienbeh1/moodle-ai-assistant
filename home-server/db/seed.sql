-- home-server/db/seed.sql
-- Sample data for development and testing
-- Run with: psql -U ai_user -d moodle_ai -f db/seed.sql

-- Sample session: a biology homework conversation
INSERT INTO sessions (id, model, title, created_at, updated_at)
VALUES (
  1,
  'mistral',
  'Explica el proceso de la fotosíntesis',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Sample messages: user prompt + AI response (with APA structure)
INSERT INTO messages (session_id, role, content, model_used, created_at)
VALUES (
  1,
  'user',
  'Explica el proceso de la fotosíntesis para mi tarea de biología',
  'mistral',
  NOW() - INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (session_id, role, content, rating, model_used, created_at)
VALUES (
  1,
  'assistant',
  E'## Introducción\n\nLa fotosíntesis es el proceso biológico fundamental mediante el cual las plantas, algas y algunas bacterias convierten la energía lumínica en energía química almacenada en forma de glucosa. Este proceso es la base de casi todas las cadenas alimenticias en la Tierra.\n\n## Desarrollo\n\nLa fotosíntesis ocurre principalmente en los cloroplastos, organelos celulares que contienen clorofila, el pigmento verde responsable de absorber la luz solar. El proceso se divide en dos etapas principales:\n\n### Reacciones de la Luz (Fase Clara)\nEn los tilacoides del cloroplasto, la clorofila absorbe fotones de luz solar. Esta energía se utiliza para:\n- Fotólisis del agua (H₂O → 2H⁺ + 2e⁻ + ½O₂)\n- Síntesis de ATP y NADPH\n- Liberación de oxígeno como subproducto\n\n### Ciclo de Calvin (Fase Oscura)\nEn el estroma del cloroplasto, el CO₂ atmosférico se fija mediante la enzima RuBisCO y se combina con ATP y NADPH para producir glucosa (C₆H₁₂O₆).\n\nLa ecuación general del proceso es:\n6CO₂ + 6H₂O + energía lumínica → C₆H₁₂O₆ + 6O₂\n\n## Conclusión\n\nLa fotosíntesis es un proceso vital que sustenta la vida en el planeta, produciendo oxígeno para la respiración de los organismos aeróbicos y glucosa como fuente de energía para los ecosistemas. Su comprensión es fundamental para la biología moderna, la agricultura y el desarrollo de tecnologías de energía solar.\n\n## Referencias APA (7ma edición)\n\nCampbell, N. A., & Reece, J. B. (2021). *Biología* (11.ª ed.). Pearson Education.\n\nStryer, L., Berg, J. M., & Tymoczko, J. L. (2019). *Bioquímica* (9.ª ed.). Reverté.\n\nTaiz, L., Zeiger, E., Møller, I. M., & Murphy, A. (2017). *Fisiología y desarrollo vegetal* (6.ª ed.). Sinauer Associates.',
  1,
  'mistral',
  NOW() - INTERVAL '2 days' + INTERVAL '30 seconds'
) ON CONFLICT DO NOTHING;

-- Second exchange: asking for a diagram
INSERT INTO messages (session_id, role, content, model_used, created_at)
VALUES (
  1,
  'user',
  'Hazme un diagrama de flujo del proceso',
  'mistral',
  NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'
) ON CONFLICT DO NOTHING;

INSERT INTO messages (session_id, role, content, model_used, created_at)
VALUES (
  1,
  'assistant',
  E'## Introducción\n\nA continuación presento un diagrama de flujo del proceso de fotosíntesis en formato Mermaid:\n\n## Desarrollo\n\n```mermaid\nflowchart TD\n    A[☀️ Energía Solar] --> B[Clorofila absorbe luz]\n    C[💧 Agua H₂O] --> D[Fotólisis del agua]\n    B --> D\n    D --> E[ATP + NADPH]\n    D --> F[🌬️ O₂ liberado]\n    G[🌫️ CO₂] --> H[Ciclo de Calvin]\n    E --> H\n    H --> I[🍬 Glucosa C₆H₁₂O₆]\n    style A fill:#FFD700,stroke:#FFA500\n    style I fill:#90EE90,stroke:#228B22\n    style F fill:#87CEEB,stroke:#4169E1\n```\n\n## Conclusión\n\nEl diagrama muestra el flujo de energía e ingredientes en la fotosíntesis: la luz solar activa la fotólisis del agua, liberando oxígeno y generando ATP/NADPH, que luego impulsan el Ciclo de Calvin para producir glucosa.\n\n## Referencias APA (7ma edición)\n\nCampbell, N. A., & Reece, J. B. (2021). *Biología* (11.ª ed.). Pearson Education.\n\nKalmus, H. (2018). Photosynthesis process diagrams in educational settings. *Journal of Biological Education, 52*(3), 245–258. https://doi.org/10.1080/00219266.2017.1357551',
  'mistral',
  NOW() - INTERVAL '2 days' + INTERVAL '6 minutes'
) ON CONFLICT DO NOTHING;

-- Sample export record
INSERT INTO exports (session_id, sheet_url, export_type, created_at)
VALUES (
  1,
  'https://docs.google.com/spreadsheets/d/SAMPLE_SHEET_ID/edit',
  'google_sheets',
  NOW() - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;
