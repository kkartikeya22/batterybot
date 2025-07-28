const { google } = require("googleapis");
const gcpCredentials = require("../config/gcpCredentials");

const auth = new google.auth.GoogleAuth({
  credentials: gcpCredentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const getSheetIdFromUrl = (url) => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const fetchSheetData = async (sheetUrl) => {
  try {
    const sheetId = getSheetIdFromUrl(sheetUrl);
    if (!sheetId) throw new Error("Invalid sheet URL");

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Get spreadsheet metadata
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const spreadsheetTitle = meta.data.properties.title;
    const sheetNames = meta.data.sheets
      .map((s) => s.properties.title)
      .filter((title) => !/^raw/i.test(title)); // Exclude "raw" prefixed sheets


    const result = {};

    for (const sheetName of sheetNames) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetName,
      });
      result[sheetName] = res.data.values || [];
    }

    return {
      success: true,
      title: spreadsheetTitle,
      data: result, // { Sheet1: [...], Sheet2: [...] }
    };

  } catch (error) {
    console.error("❌ Failed to fetch sheet data:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = fetchSheetData;
