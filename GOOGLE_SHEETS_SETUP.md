# Google Sheets & Google Apps Script Setup Guide

This guide explains how to connect your IEEE Proctored Examination System directly to a Google Sheet so that candidate details, attempts, scores, and exam logs are stored automatically.

---

## 1. System Protocols
1. **Primary Key**: `Enrollment Number *`
2. **Attempt Enforcement**: Each candidate can take at most **2 attempts** (`Attempt 1` and `Attempt 2`).
   - A 3rd attempt is automatically blocked by both the Google Apps Script and the Exam Client.
3. **Multi-Stage Verification Gate**:
   - Registration with Full Name, Phone Number, Department, Section, Roll Number, and Enrollment Number.
   - Scan Stage 1 QR code: `IEEE-PYTHON-GAME` to unlock the Python logic challenge.
   - Solve Python Code Block Assembly problem.
   - Reveal assigned Room Number: **`B3LG2.8`**.
   - Scan Stage 2 QR code: `IEEE-EXAM-START` inside Room B3LG2.8 to launch the timed offline exam.
4. **Offline Proctoring**:
   - The MCQ exam runs in offline mode.
   - Connecting to mobile data or Wi-Fi during the exam triggers automatic auto-submission.

---

## 2. Quick 4-Step Setup

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) in your browser.
2. Rename the spreadsheet to: `IEEE Examination Submissions 2026`.

### Step 2: Open Apps Script Editor
1. In your Google Sheet, click the top menu: **Extensions** > **Apps Script**.
2. A code editor will open in a new tab.

### Step 3: Paste the Code
1. Select and delete any default code (`function myFunction() { ... }`).
2. Copy the full contents of `src/google-apps-script/Code.gs` from this project.
3. Paste it into the editor.
4. Click the **Save** (floppy disk) icon or press `Ctrl + S` / `Cmd + S`.

### Step 4: Deploy as a Web App
1. At the top right of the Apps Script editor, click the blue **Deploy** button > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the fields:
   - **Description**: `IEEE Exam Submissions API`
   - **Execute as**: `Me (your_email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial: This allows student browsers to submit records without requiring Google sign-in)*
4. Click **Deploy**.
5. Grant permissions if prompted by Google ("Authorize access" > Choose your account > Advanced > Go to Untitled project).
6. Copy the **Web app URL** (it ends with `/exec`).

---

## 3. Sheet Column Structure
The Apps Script will automatically format the sheet with frozen, styled navy-blue headers:

| Col | Header | Description |
|---|---|---|
| A | Timestamp | Date & time of submission |
| B | **Enrollment Number** | **PRIMARY KEY** (Used to enforce max 2 attempts) |
| C | Attempt Number | `1` or `2` |
| D | Candidate Name | Full Name entered during registration |
| E | Phone Number | Candidate contact number |
| F | Roll Number | Candidate Roll Number |
| G | Department | Candidate department (user input) |
| H | Section | Candidate section (user input) |
| I | Email | Student email address |
| J | Room Assigned | `B3LG2.8` |
| K | Python Game | Status of code assembly qualification (`Passed`) |
| L | Score | Correct answers count |
| M | Total Questions | Total number of questions (20) |
| N | Percentage (%) | Candidate final percentage |
| O | Submission Reason | AUTO_NETWORK_DETECTED / TIMER_EXPIRED / MANUAL |
| P | Time Spent (s) | Seconds taken |
| Q | Submission ID | Unique cryptographic receipt ID |
