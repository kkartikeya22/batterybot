const { google } = require("googleapis");

async function getSheetData(sheetUrl) {

  const sheetId = extractSheetId(sheetUrl);

  const auth = await getAuth(); // Your existing OAuth2 or service account logic

  const sheets = google.sheets({ version: "v4", auth });

  // Fetch spreadsheet metadata (including spreadsheet name)
  const spreadsheetMeta = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheetTitle = spreadsheetMeta?.data?.properties?.title;

  // Get actual sheet data
  const sheetData = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  });


  const sheetsData = {};
  sheetData.data.sheets.forEach((sheet, index) => {
    const sheetName = sheet.properties.title;

    const rows = sheet.data[0]?.rowData || [];

    const parsedRows = rows.map((row, rIdx) => {
      const parsed = row.values?.map((cell) => cell.formattedValue || "");
      return parsed;
    });

    sheetsData[sheetName] = parsedRows;
  });


  return {
    data: sheetsData,
    sheetName: sheetTitle,
    sheetUrl,
  };
}

function extractSheetId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const id = match ? match[1] : null;
  return id;
}
