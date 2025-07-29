const express = require("express");
const { google } = require("googleapis");
const router = express.Router();
const gcpCredentials = require("../config/gcpCredentials");

console.log('[DEBUG] gcpCredentials:', gcpCredentials);

const auth = new google.auth.GoogleAuth({
  credentials: gcpCredentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

router.post("/read-sheet", async (req, res) => {
  try {
    const { sheetUrl } = req.body;

    const spreadsheetId = extractSheetId(sheetUrl);

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Get spreadsheet metadata (title + sheet names)
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const spreadsheetTitle = meta.data.properties?.title || "Untitled";

    // Filter out sheet names that start with "raw" (case-insensitive)
    const sheetNames = meta.data.sheets
      .map((s) => s.properties.title)
      .filter((name) => !/^raw/i.test(name));


    const data = {};

    for (const name of sheetNames) {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: name,
      });
      data[name] = result.data.values;
    }

    res.json({ success: true, title: spreadsheetTitle, data });
  } catch (err) {
    console.error("[ERROR] Failed to fetch sheet:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

function extractSheetId(url) {
  const regex = /\/d\/(.*?)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
}

module.exports = router;
