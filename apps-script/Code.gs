function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('leads');
    var data = JSON.parse(e.postData.contents);
    
    var ids = sheet.getRange("A:A").getValues().flat();
    if (ids.includes(data.request_id)) {
      return ContentService.createTextOutput(JSON.stringify({ok: false, error: "Duplicate ID"}))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers); // <-- Используем setHeaders
    }
    
    sheet.appendRow([
      data.request_id, new Date(), data.name, "'" + data.phone, 
      data.email || "", data.car_type, data.rim_size, data.slot, 
      data.utm_source || "direct", data.utm_medium || "none", 
      data.utm_campaign || "not_set", data.utm_content || "not_set", 
      "new", data.service_type || "" 
    ]);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setNumberFormat('@');
    
    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers); // <-- Используем setHeaders
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers); // <-- Используем setHeaders
  } finally {
    lock.releaseLock();
  }
}