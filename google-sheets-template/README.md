# 📊 Google Sheets Template — Setup Guide

## Overview

The Google Sheets template is used to receive exported homework from the AI assistant. It has structured tabs for each academic section.

---

## Tab Structure

| Tab Name | Contents |
|----------|---------|
| **Portada** | Cover page: student name, matricula, date, subject, teacher |
| **Introduccion** | Introduction section text |
| **Desarrollo** | Development/body section text |
| **Conclusion** | Conclusion section text |
| **Referencias** | APA references list |

---

## Step 1 — Create the Template

1. Go to https://sheets.google.com
2. Click **Blank spreadsheet** (+)
3. Rename the file: "Plantilla Tarea Académica — AI Assistant"

### Create the tabs
At the bottom of the screen:
1. Rename "Sheet1" to `Portada`
2. Click the **+** button to add tabs:
   - `Introduccion`
   - `Desarrollo`
   - `Conclusion`
   - `Referencias`

### Format the Portada tab
In the **Portada** tab, set up these cells:

| Cell | Content |
|------|---------|
| A1 | "DATOS DEL ALUMNO" (bold, merged A1:B1) |
| A2 | "Nombre:" |
| B2 | *(left empty — filled by export)* |
| A3 | "Matrícula:" |
| B3 | *(left empty — filled by export)* |
| A4 | "Fecha:" |
| B4 | *(left empty — filled by export)* |
| A5 | "Materia:" |
| B5 | *(left empty — filled by export)* |
| A6 | "Profesor:" |
| B6 | *(left empty — filled by export)* |

### Format content tabs
In **Introduccion**, **Desarrollo**, **Conclusion**, **Referencias** tabs:
- Select cell A1
- Set column A width to 600px (for long text)
- Enable text wrapping: Format → Text wrapping → Wrap

---

## Step 2 — Get the Spreadsheet ID

The Spreadsheet ID is found in the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit#gid=0
```

Copy that long ID string. You'll need it for your `.env` file as `GOOGLE_SHEET_TEMPLATE_ID`.

---

## Step 3 — Share with Service Account

1. Click the **Share** button (top right)
2. In the "Add people and groups" field, paste the service account email
   - Find it in your JSON key file, field: `"client_email": "..."@....iam.gserviceaccount.com`
3. Set permission to **Editor**
4. Uncheck "Notify people"
5. Click **Share**

---

## Step 4 — Test the Export

1. Make sure your server is running
2. Have a chat session with the AI assistant
3. Go to the Export tab in the web panel
4. Fill in your name and subject
5. Click "Export to Google Sheets"
6. Click the link that appears → your Google Sheet should be filled!

---

## Cell Mapping Reference

See `sheet-mapping.json` for the exact cell addresses used by the exporter.

| Section | Cell | Written by |
|---------|------|-----------|
| Student name | Portada!B2 | Export form |
| Matrícula | Portada!B3 | Export form |
| Date | Portada!B4 | Auto (today) |
| Subject | Portada!B5 | Export form |
| Teacher | Portada!B6 | Export form |
| Introduction | Introduccion!A1 | AI response |
| Development | Desarrollo!A1 | AI response |
| Conclusion | Conclusion!A1 | AI response |
| References | Referencias!A1 | AI response |

---

## Troubleshooting

### "The caller does not have permission"
- Verify the service account email has **Editor** access to the spreadsheet
- Make sure you shared with the exact `client_email` from the JSON key file

### "Spreadsheet not found"
- Check the `GOOGLE_SHEET_TEMPLATE_ID` in your `.env` file
- Make sure the ID is copied correctly from the URL

### "File not found" for key file
- Check `GOOGLE_SERVICE_ACCOUNT_PATH` in `.env` points to the correct JSON file
- The path is relative to the `home-server/` directory

### Cells not filling
- Check the tab names are EXACTLY: `Portada`, `Introduccion`, `Desarrollo`, `Conclusion`, `Referencias`
- Tab names are case-sensitive
