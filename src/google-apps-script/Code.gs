/**
 * =========================================================================
 * GOOGLE APPS SCRIPT FOR IEEE PROCTORED EXAMINATION SYSTEM
 * =========================================================================
 * 
 * Instructions to Deploy:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click on "Extensions" > "Apps Script"
 * 3. Delete any existing code in the editor, and paste this entire code.
 * 4. Click the "Save" (disk) icon.
 * 5. Click "Deploy" > "New deployment"
 * 6. Click the Gear icon (Select type) -> Select "Web app"
 * 7. Configuration (CRITICAL):
 *    - Description: "IEEE Exam Submissions API"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (VERY IMPORTANT: MUST be "Anyone" so candidate submissions are allowed)
 * 8. Click "Deploy", review permissions, and click "Allow".
 * 9. Copy the resulting "Web app URL" (it ends with /exec).
 *    NOTE: Do NOT copy the URL from the browser address bar (which ends in /edit).
 * 10. The system logs all submissions to this Google Sheet!
 * 
 * Captured Fields:
 * - Primary Key: "Enrollment Number *"
 * - Phone Number, Department, Section
 * - Assigned Room: "B2LG2.8"
 * - Python Qualification Status
 * - Score, Accuracy %, Submission Reason, Time Spent
 * =========================================================================
 */

const SHEET_NAME = "Exam_Submissions";
const MAX_ATTEMPTS = 2;

// Column Headers
const HEADERS = [
  "Timestamp",            // Col 1 (A)
  "Enrollment Number",    // Col 2 (B) - PRIMARY KEY
  "Attempt Number",       // Col 3 (C)
  "Candidate Name",       // Col 4 (D)
  "Phone Number",         // Col 5 (E)
  "Roll Number",          // Col 6 (F)
  "Department",           // Col 7 (G)
  "Section",              // Col 8 (H)
  "Email",                // Col 9 (I)
  "Room Assigned",        // Col 10 (J)
  "Python Game",          // Col 11 (K)
  "Score",                // Col 12 (L)
  "Total Questions",      // Col 13 (M)
  "Percentage (%)",       // Col 14 (N)
  "Submission Reason",    // Col 15 (O)
  "Time Spent (seconds)", // Col 16 (P)
  "Submission ID"         // Col 17 (Q)
];

/**
 * Helper to get or create the submissions sheet with proper styling and headers.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    const allSheets = ss.getSheets();
    if (allSheets.length === 1 && (allSheets[0].getLastRow() === 0 || allSheets[0].getName().toLowerCase().indexOf("sheet") >= 0)) {
      sheet = allSheets[0];
      sheet.setName(SHEET_NAME);
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }
  
  try {
    ss.setActiveSheet(sheet);
  } catch (e) {}

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1e3a8a"); // Navy Blue
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);
    
    for (var i = 1; i <= HEADERS.length; i++) {
      try {
        sheet.autoResizeColumn(i);
      } catch (err) {}
    }
  }
  
  return sheet;
}

/**
 * Search all past attempts for a given Enrollment Number (Primary Key)
 */
function getAttemptsByEnrollment(enrollmentNumber) {
  if (!enrollmentNumber) return [];
  
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const searchEnrollment = String(enrollmentNumber).trim().toUpperCase();
  const values = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), HEADERS.length)).getValues();
  
  const attempts = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowEnrollment = String(row[1]).trim().toUpperCase();
    if (rowEnrollment === searchEnrollment) {
      attempts.push({
        rowNumber: i + 2,
        timestamp: row[0],
        enrollmentNumber: row[1],
        attemptNumber: Number(row[2]) || (attempts.length + 1),
        candidateName: row[3],
        submissionId: row[row.length - 1]
      });
    }
  }
  return attempts;
}

/**
 * Handles HTTP GET requests
 */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || "ping";
    
    if (action === "ping") {
      return createJsonResponse({
        status: "ok",
        message: "Google Sheet Exam API is connected and online",
        sheetName: SHEET_NAME,
        maxAttemptsPerStudent: MAX_ATTEMPTS,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === "checkAttempts") {
      const enrollmentNumber = params.enrollmentNumber;
      if (!enrollmentNumber || !enrollmentNumber.trim()) {
        return createJsonResponse({
          status: "error",
          message: "Parameter 'enrollmentNumber' is required."
        });
      }
      
      const cleanEnrollment = String(enrollmentNumber).trim().toUpperCase();
      const attempts = getAttemptsByEnrollment(cleanEnrollment);
      const attemptCount = attempts.length;
      const canAttempt = attemptCount < MAX_ATTEMPTS;
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptCount);
      
      return createJsonResponse({
        status: "success",
        enrollmentNumber: cleanEnrollment,
        attemptCount: attemptCount,
        maxAttempts: MAX_ATTEMPTS,
        canAttempt: canAttempt,
        remainingAttempts: remainingAttempts,
        isBlocked: !canAttempt,
        message: canAttempt 
          ? "Enrollment Number eligible to take exam. Attempt " + (attemptCount + 1) + " of " + MAX_ATTEMPTS + "."
          : "Maximum attempts reached (" + MAX_ATTEMPTS + "/" + MAX_ATTEMPTS + ") for Enrollment Number: " + cleanEnrollment + ".",
        pastAttempts: attempts
      });
    }

    if (action === "submit") {
      var data = {};
      if (params.data) {
        try {
          data = JSON.parse(params.data);
        } catch (je) {
          data = params;
        }
      } else {
        data = params;
      }
      return processSubmission(data);
    }
    
    return createJsonResponse({
      status: "error",
      message: "Unknown action: " + action
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Handles HTTP POST requests
 */
function doPost(e) {
  var data = {};
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      data = e.parameter || {};
    }
  } else if (e && e.parameter) {
    data = e.parameter;
  }
  return processSubmission(data);
}

/**
 * Core submission recording logic
 */
function processSubmission(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockError) {
    return createJsonResponse({
      status: "error",
      message: "Server busy, please try submitting again in a moment."
    });
  }
  
  try {
    const student = data.student || data;
    const enrollmentNumber = String(student.enrollmentNumber || data.enrollmentNumber || "").trim().toUpperCase();
    
    if (!enrollmentNumber) {
      return createJsonResponse({
        status: "error",
        message: "Validation Error: 'Enrollment Number *' (Primary Key) is required."
      });
    }
    
    // 1. Check existing attempts for this Enrollment Number
    const existingAttempts = getAttemptsByEnrollment(enrollmentNumber);
    const existingCount = existingAttempts.length;
    
    if (existingCount >= MAX_ATTEMPTS) {
      return createJsonResponse({
        status: "error",
        code: "MAX_ATTEMPTS_EXCEEDED",
        enrollmentNumber: enrollmentNumber,
        attemptCount: existingCount,
        maxAttempts: MAX_ATTEMPTS,
        canAttempt: false,
        message: "Attempt rejected: Enrollment Number " + enrollmentNumber + " has already completed all " + MAX_ATTEMPTS + " allowed attempts.",
        pastAttempts: existingAttempts
      });
    }
    
    // 2. Prepare submission details
    const attemptNumber = existingCount + 1; // Attempt 1 or 2
    const candidateName = String(student.name || data.name || "").trim();
    const phone = String(student.phone || data.phone || "").trim();
    const rollNumber = String(student.roll || data.roll || "").trim();
    const department = String(student.department || data.department || "").trim();
    const section = String(student.section || data.section || "").trim();
    const email = String(student.email || data.email || "").trim();
    const roomNumber = String(data.roomNumber || student.roomNumber || "B2LG2.8").trim();
    const pythonGame = data.pythonGameSolved ? "Passed" : "Verified";
    
    const score = Number(data.score !== undefined ? data.score : 0);
    const totalQuestions = Number(data.totalQuestions !== undefined ? data.totalQuestions : 20);
    const percentage = Number(data.percentage !== undefined ? data.percentage : Math.round((score / totalQuestions) * 100));
    
    const submissionReason = String(data.submissionReason || "MANUAL_SUBMISSION");
    const timeSpent = Number(data.timeSpentSeconds || 0);
    const submissionId = String(data.submissionId || data.id || ("sub_" + new Date().getTime()));
    const timestamp = new Date();
    
    // 3. Append row to sheet
    const sheet = getOrCreateSheet();
    sheet.appendRow([
      timestamp,
      enrollmentNumber,
      attemptNumber,
      candidateName,
      phone,
      rollNumber,
      department,
      section,
      email,
      roomNumber,
      pythonGame,
      score,
      totalQuestions,
      percentage,
      submissionReason,
      timeSpent,
      submissionId
    ]);
    
    const newLastRow = sheet.getLastRow();
    
    return createJsonResponse({
      status: "success",
      message: "Exam record successfully saved to Google Sheet!",
      sheetName: SHEET_NAME,
      rowNumber: newLastRow,
      enrollmentNumber: enrollmentNumber,
      attemptNumber: attemptNumber,
      maxAttempts: MAX_ATTEMPTS,
      remainingAttempts: MAX_ATTEMPTS - attemptNumber,
      score: score,
      percentage: percentage,
      roomNumber: roomNumber,
      submissionId: submissionId,
      timestamp: timestamp.toISOString()
    });
    
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Execution failure: " + err.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Helper to build JSON responses with proper CORS headers for browser requests
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
