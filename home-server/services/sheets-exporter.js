// home-server/services/sheets-exporter.js
// Google Sheets API integration for homework export

import { google } from 'googleapis';

/**
 * Authenticate with Google Sheets API using a service account key file
 * @param {string} keyFilePath - Path to service account JSON key file
 * @returns {import('googleapis').Auth.GoogleAuth} Authenticated Google Auth client
 */
export function authenticate(keyFilePath) {
  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

/**
 * Update the homework template spreadsheet with academic content
 * @param {import('googleapis').Auth.GoogleAuth} auth
 * @param {string} spreadsheetId
 * @param {object} data - Academic content to write
 * @param {string} data.studentName
 * @param {string} data.matricula
 * @param {string} data.date
 * @param {string} data.subject
 * @param {string} data.teacherName
 * @param {string} data.introduction
 * @param {string} data.development
 * @param {string} data.conclusion
 * @param {string} data.references
 * @returns {Promise<string>} URL of the updated spreadsheet
 */
export async function updateTemplate(auth, spreadsheetId, data) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Define all the cell updates (using batchUpdate for efficiency)
  const batchData = [
    // Portada (cover page)
    { range: 'Portada!B2', values: [[data.studentName || '']] },
    { range: 'Portada!B3', values: [[data.matricula || '']] },
    { range: 'Portada!B4', values: [[data.date || new Date().toLocaleDateString('es-MX')]] },
    { range: 'Portada!B5', values: [[data.subject || '']] },
    { range: 'Portada!B6', values: [[data.teacherName || '']] },
    // Academic sections
    { range: 'Introduccion!A1', values: [[data.introduction || '']] },
    { range: 'Desarrollo!A1', values: [[data.development || '']] },
    { range: 'Conclusion!A1', values: [[data.conclusion || '']] },
    { range: 'Referencias!A1', values: [[data.references || '']] },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: batchData,
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

/**
 * Parse an AI response (APA-structured) into its component sections
 * Uses regex to find Introducción, Desarrollo, Conclusión, and Referencias sections
 * @param {string} text - Full AI response text
 * @returns {{ introduction: string, development: string, conclusion: string, references: string }}
 */
export function parseAcademicSections(text) {
  if (!text || typeof text !== 'string') {
    return { introduction: '', development: '', conclusion: '', references: '' };
  }

  // Matches section headers like:
  // ## Introducción, ## Introduction, **Introducción**, # INTRODUCCIÓN, etc.
  const sectionPattern = /(?:^|\n)(?:#{1,3}\s*|[*_]{2})?(?:introducción|introduction|intro)(?:[*_]{2})?[^\n]*/i;
  const developmentPattern = /(?:^|\n)(?:#{1,3}\s*|[*_]{2})?(?:desarrollo|development|cuerpo|body)(?:[*_]{2})?[^\n]*/i;
  const conclusionPattern = /(?:^|\n)(?:#{1,3}\s*|[*_]{2})?(?:conclusi[oó]n|conclusions?)(?:[*_]{2})?[^\n]*/i;
  const referencesPattern = /(?:^|\n)(?:#{1,3}\s*|[*_]{2})?(?:referencias?|references?|bibliograf[ií]a)(?:[*_]{2})?[^\n]*/i;

  /**
   * Extract content between two section markers
   * @param {string} fullText
   * @param {RegExp} startPattern
   * @param {RegExp[]} endPatterns - Content ends when any of these patterns is found
   * @returns {string}
   */
  function extractSection(fullText, startPattern, endPatterns) {
    const startMatch = fullText.match(startPattern);
    if (!startMatch) return '';

    const startIndex = startMatch.index + startMatch[0].length;
    let endIndex = fullText.length;

    for (const endPattern of endPatterns) {
      const endMatch = fullText.slice(startIndex).match(endPattern);
      if (endMatch) {
        const candidateEnd = startIndex + endMatch.index;
        if (candidateEnd < endIndex) {
          endIndex = candidateEnd;
        }
      }
    }

    return fullText.slice(startIndex, endIndex).trim();
  }

  const otherSections = [developmentPattern, conclusionPattern, referencesPattern];

  return {
    introduction: extractSection(text, sectionPattern, otherSections),
    development: extractSection(text, developmentPattern, [conclusionPattern, referencesPattern]),
    conclusion: extractSection(text, conclusionPattern, [referencesPattern]),
    references: extractSection(text, referencesPattern, []),
  };
}
