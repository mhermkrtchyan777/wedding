/**
 * =============================================================
 *  RSVP → Google Sheets
 *  Google Apps Script Web App backend for the wedding site.
 *
 *  Տեղադրման ուղեցույցը՝ SETUP.md
 *  Deployment instructions: see SETUP.md
 * =============================================================
 */

/** Թերթի անունը / Sheet tab name. */
var SHEET_NAME = 'RSVP';

/** Ամփոփման թերթի անունը / Summary tab name. */
var SUMMARY_NAME = 'Ամփոփում';

/** Սյուների վերնագրերը / Column headers. */
var HEADERS = [
  'Ամսաթիվ',        // A — when it was submitted
  'Անուն',           // B — first name
  'Ազգանուն',        // C — last name
  'Պատասխան',        // D — Կգա / Չի գա
  'Հայտի ID',        // E — groups guests from the same submission
  'Հյուրերի քանակ'   // F — how many people were in that submission
];


/* =============================================================
   POST — ձևաթղթի ուղարկում / form submission
   ============================================================= */
function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var payload = parseBody_(e);

    var attending = String(payload.attending || '').toLowerCase();
    if (attending !== 'yes' && attending !== 'no') {
      return json_({ result: 'error', message: 'Invalid "attending" value: ' + attending });
    }

    var guests = Array.isArray(payload.guests) ? payload.guests : [];
    if (guests.length === 0) {
      return json_({ result: 'error', message: 'No guests in payload' });
    }

    var sheet     = getSheet_();
    var stamp     = new Date();
    var answer    = attending === 'yes' ? 'Կգա' : 'Չի գա';
    var groupId   = Utilities.getUuid().slice(0, 8);
    var headcount = guests.length;

    var rows = guests.map(function (g) {
      return [
        stamp,
        clean_(g.firstName),
        clean_(g.lastName),
        answer,
        groupId,
        headcount
      ];
    });

    sheet
      .getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length)
      .setValues(rows);

    return json_({
      result: 'success',
      saved: rows.length,
      submissionId: groupId
    });

  } catch (err) {
    // Չկորցնենք տվյալները՝ սխալը գրանցում ենք լոգում։
    console.error('doPost failed: ' + err + '\n' + (err.stack || ''));
    return json_({ result: 'error', message: String(err) });

  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


/* =============================================================
   GET — ստուգում / health check
   Բացեք Web App-ի հասցեն browser-ում՝ վիճակագրությունը տեսնելու։
   Open the Web App URL in a browser to see live counts.
   ============================================================= */
function doGet() {
  try {
    var sheet = getSheet_();
    var last  = sheet.getLastRow();

    if (last < 2) {
      return json_({ result: 'success', status: 'ok', coming: 0, notComing: 0, submissions: 0 });
    }

    var values = sheet.getRange(2, 4, last - 1, 2).getValues(); // D:E
    var coming = 0, notComing = 0, ids = {};

    values.forEach(function (r) {
      if (r[0] === 'Կգա') coming++;
      else if (r[0] === 'Չի գա') notComing++;
      if (r[1]) ids[r[1]] = true;
    });

    return json_({
      result: 'success',
      status: 'ok',
      coming: coming,
      notComing: notComing,
      submissions: Object.keys(ids).length
    });

  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  }
}


/* =============================================================
   Օգնական ֆունկցիաներ / Helpers
   ============================================================= */

/**
 * Կարդում է POST-ի մարմինը։
 * Կայքն ուղարկում է JSON՝ text/plain տիպով (CORS preflight-ից խուսափելու համար),
 * բայց ընդունում ենք նաև սովորական form-encoded տվյալներ։
 */
function parseBody_(e) {
  if (!e) {
    throw new Error('Այս ֆունկցիան պետք է կանչվի HTTP հարցումով, ոչ թե խմբագրիչից։');
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (ignore) {
      // ընկնում ենք ներքև՝ form-encoded տարբերակին
    }
  }

  var p = e.parameter || {};
  if (p.payload) return JSON.parse(p.payload);

  throw new Error('Հարցումը դատարկ է կամ անճանաչելի ձևաչափով։');
}

/** Վերադարձնում է RSVP թերթը՝ ստեղծելով, եթե չկա։ */
function getSheet_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var head = sheet.getRange(1, 1, 1, HEADERS.length);
    head.setValues([HEADERS])
        .setFontWeight('bold')
        .setBackground('#F4EEE4')
        .setFontColor('#2E2A25');

    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 165);  // Ամսաթիվ
    sheet.setColumnWidth(2, 150);  // Անուն
    sheet.setColumnWidth(3, 150);  // Ազգանուն
    sheet.setColumnWidth(4, 110);  // Պատասխան
    sheet.setColumnWidth(5, 100);  // Հայտի ID
    sheet.setColumnWidth(6, 130);  // Հյուրերի քանակ

    sheet.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');

    ensureSummary_(ss);
  }

  return sheet;
}

/** Ստեղծում է «Ամփոփում» թերթը՝ կենդանի բանաձևերով։ */
function ensureSummary_(ss) {
  if (ss.getSheetByName(SUMMARY_NAME)) return;

  var s = ss.insertSheet(SUMMARY_NAME, 0);

  s.getRange('A1').setValue('Ամփոփում')
    .setFontSize(16).setFontWeight('bold').setFontColor('#2E2A25');

  // Apps Script-ը բանաձևերը միշտ ընդունում է ստորակետով և ինքն է
  // թարգմանում աղյուսակի լոկալի բաժանարարին։
  var q = "'" + SHEET_NAME + "'";

  s.getRange('A3:A6').setValues([
    ['Կգան (հյուր)'],
    ['Չեն գա (հյուր)'],
    ['Ուղարկված հայտեր'],
    ['Ընդհանուր պատասխան']
  ]);

  s.getRange('B3:B6').setFormulas([
    ['=COUNTIF(' + q + '!D:D,"Կգա")'],
    ['=COUNTIF(' + q + '!D:D,"Չի գա")'],
    ['=IFERROR(COUNTA(UNIQUE(FILTER(' + q + '!E2:E,' + q + '!E2:E<>""))),0)'],
    ['=IFERROR(COUNTA(' + q + '!B2:B),0)']
  ]);

  s.getRange('A3:A6').setFontWeight('bold');
  s.getRange('B3:B6').setFontSize(14).setHorizontalAlignment('left');
  s.setColumnWidth(1, 200);
  s.setColumnWidth(2, 120);
}

/** Մաքրում է տեքստը՝ ավելորդ բացատներից և չափից երկար արժեքներից։ */
function clean_(v) {
  return String(v == null ? '' : v).trim().slice(0, 120);
}

/** JSON պատասխան։ */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
