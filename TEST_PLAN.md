# 🧪 Moodle HTML Diagnostic Tests — Test Plan

## Purpose

Before deploying the launcher, you need to know **which HTML elements Moodle allows** for student-level users. Moodle's HTML Purifier filters different things depending on:
- Your Moodle version
- Your school's configuration
- Your user role (student vs teacher vs admin)

Running these 15 tests tells you exactly what you can and can't use.

---

## How to Run Tests

1. Log into Moodle as your student account
2. Go to your Dashboard/Welcome page
3. Click the gear icon → "Edit"
4. Find a Text/HTML block or add one: "Add block" → "HTML"
5. Click "Edit" on the block
6. In the TinyMCE editor, click the **"< >"** or **"Source Code"** button to switch to HTML view
7. Paste the test HTML from this document
8. Click **"Save"**
9. Exit edit mode
10. Look at what actually rendered on your dashboard
11. Record results in the table at the bottom
12. Repeat for each test (paste one test at a time, or all together)

---

## The 15 Tests

See `moodle-snippet/diagnostic-tests.html` for the complete test file to paste.

### Test 1 — Inline Styles on `<div>`
```html
<!-- TEST 1: Inline style on div -->
<!-- PASS: Colored box appears -->
<!-- FAIL: Plain text or no box -->
<div style="background-color:#1a73e8;color:#ffffff;padding:15px;border-radius:8px;font-weight:bold;text-align:center;">
  ✅ TEST 1 PASS: Inline styles on div work
</div>
```
**Expected PASS**: Blue rounded box with white text
**Expected FAIL**: Plain text "TEST 1 PASS: Inline styles on div work" with no styling

---

### Test 2 — Link with `target="_blank"`
```html
<!-- TEST 2: Link with target blank and rel -->
<!-- PASS: Link opens in new tab -->
<!-- FAIL: Link opens in same tab (target stripped) -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  ✅ TEST 2: Link (should open new tab)
</a>
```
**Expected PASS**: Link opens in a new tab when clicked
**Expected FAIL**: Link exists but opens in same tab (target stripped)

---

### Test 3 — External Image
```html
<!-- TEST 3: External image with inline style -->
<!-- PASS: Image visible with rounded corners -->
<!-- FAIL: Broken image or image with no border-radius -->
<img src="https://picsum.photos/300/100" alt="External image test" style="border-radius:8px;display:block;">
```
**Expected PASS**: Image loads and shows rounded corners
**Expected FAIL**: No image or image with sharp corners (style stripped)

---

### Test 4 — Clickable Image Link
```html
<!-- TEST 4: Image wrapped in link (our main launch button pattern) -->
<!-- PASS: Clicking image opens new tab -->
<!-- FAIL: Image not clickable or doesn't open new tab -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  <img src="https://picsum.photos/320/60" alt="Click me" style="border:2px solid #1a73e8;border-radius:4px;">
</a>
```
**Expected PASS**: Image is clickable and opens new tab
**Expected FAIL**: Image not clickable (anchor stripped or target stripped)

---

### Test 5 — `<style>` Tag
```html
<!-- TEST 5: Style tag (expected to be stripped in most Moodle configs) -->
<!-- PASS: Text appears green (class works) -->
<!-- FAIL: Text appears in default color (style tag stripped) -->
<style>.moodle-test-5{color:green;font-weight:bold;}</style>
<p class="moodle-test-5">TEST 5: Style tag test (green if PASS, default if FAIL)</p>
```
**Expected PASS**: Text is green (style tag allowed — rare)
**Expected FAIL**: Text is default color (style tag stripped — common)

---

### Test 6 — `<script>` Tag (Expected to FAIL)
```html
<!-- TEST 6: Script tag — EXPECTED TO FAIL in all Moodle configs -->
<!-- PASS: Alert "Script tag worked!" appears (very unlikely) -->
<!-- FAIL: No alert (script stripped — expected behavior) -->
<script>alert('TEST 6: Script tag worked!');</script>
<p>TEST 6: Script tag (alert should NOT appear — script is expected to be stripped)</p>
```
**Expected FAIL (normal behavior)**: No alert, just the paragraph text
**Expected PASS (unexpected)**: Alert dialog appears

---

### Test 7 — `<iframe>` (Expected to FAIL)
```html
<!-- TEST 7: iframe — EXPECTED TO FAIL in all Moodle configs -->
<!-- PASS: Example.com appears embedded (very unlikely) -->
<!-- FAIL: No embedded content, just gap (iframe stripped — expected) -->
<iframe src="https://example.com" width="300" height="100" title="iframe test"></iframe>
<p>TEST 7: iframe (content should NOT appear — iframe is expected to be stripped)</p>
```
**Expected FAIL (normal behavior)**: No embedded content
**Expected PASS (unexpected)**: Example.com appears in an embedded frame

---

### Test 8 — HTML Form
```html
<!-- TEST 8: Form with input and submit button -->
<!-- PASS: Input field and button visible, form submits to new tab -->
<!-- FAIL: No form elements (form stripped) -->
<form action="https://example.com" method="get" target="_blank">
  <input type="text" placeholder="TEST 8: Form input" style="padding:5px;margin-right:5px;">
  <button type="submit" style="padding:5px 10px;background:#1a73e8;color:white;border:none;cursor:pointer;">
    Submit
  </button>
</form>
```
**Expected PASS**: Input field and button visible
**Expected FAIL**: No form elements visible

---

### Test 9 — Bootstrap Classes
```html
<!-- TEST 9: Bootstrap CSS classes (4 variants) -->
<!-- PASS: Colored alert boxes appear (Bootstrap loaded) -->
<!-- FAIL: Unstyled divs (Bootstrap not available) -->
<div class="alert alert-info">TEST 9a: Bootstrap alert-info</div>
<div class="alert alert-success">TEST 9b: Bootstrap alert-success</div>
<div class="alert alert-warning">TEST 9c: Bootstrap alert-warning</div>
<div class="alert alert-danger">TEST 9d: Bootstrap alert-danger</div>
```
**Expected PASS**: Colored boxes (blue, green, yellow, red) — Moodle uses Bootstrap
**Expected FAIL**: Plain text in divs

---

### Test 10 — Styled Table
```html
<!-- TEST 10: Table with inline styles -->
<!-- PASS: Table with colored header visible -->
<!-- FAIL: Unstyled table or no table -->
<table style="border-collapse:collapse;width:100%;margin:10px 0;">
  <thead>
    <tr style="background-color:#1a73e8;color:white;">
      <th style="padding:8px;border:1px solid #ddd;">Column A</th>
      <th style="padding:8px;border:1px solid #ddd;">Column B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">TEST 10</td>
      <td style="padding:8px;border:1px solid #ddd;">Table with styles</td>
    </tr>
  </tbody>
</table>
```
**Expected PASS**: Table with blue header visible
**Expected FAIL**: Unstyled table or no table

---

### Test 11 — Data Attributes
```html
<!-- TEST 11: Data attributes on div -->
<!-- PASS: Div visible (data attributes kept or stripped silently) -->
<!-- FAIL: Div not rendered (unusual) -->
<div data-role="ai-launcher" data-url="https://example.com"
     style="padding:10px;background:#e8f5e9;border-radius:4px;">
  TEST 11: Data attributes on div (visible = PASS)
</div>
```
**Expected PASS**: Green-tinted div visible (data attributes may be stripped silently)
**Expected FAIL**: No div rendered

---

### Test 12 — Inline SVG
```html
<!-- TEST 12: Inline SVG element -->
<!-- PASS: Green circle visible -->
<!-- FAIL: No circle (SVG stripped) -->
<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
  <circle cx="20" cy="20" r="16" fill="#00cc44"/>
  <text x="20" y="25" text-anchor="middle" fill="white" font-size="14">12</text>
</svg>
<span> TEST 12: SVG inline (circle = PASS, no circle = FAIL)</span>
```
**Expected PASS**: Green circle with "12" inside appears
**Expected FAIL**: No circle, just the text

---

### Test 13 — `<object>` Tag
```html
<!-- TEST 13: Object tag (expected to fail usually) -->
<!-- PASS: Content embedded -->
<!-- FAIL: Nothing shown (object stripped) -->
<object data="https://example.com" type="text/html" width="300" height="80">
  TEST 13: Object tag fallback text (object stripped = FAIL)
</object>
```
**Expected FAIL (normal)**: Only fallback text visible or nothing
**Expected PASS (rare)**: Content embedded

---

### Test 14 — External CSS `<link>`
```html
<!-- TEST 14: External stylesheet link tag -->
<!-- PASS: Bootstrap styles apply to test div (link tag allowed) -->
<!-- FAIL: Unstyled div (link tag stripped) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
<div class="btn btn-primary" style="display:inline-block;margin:5px;">
  TEST 14: External CSS link tag (styled = PASS)
</div>
```
**Expected FAIL (normal)**: Unstyled div (link tag stripped)
**Expected PASS (rare)**: Bootstrap button styles appear

---

### Test 15 — Meta Refresh
```html
<!-- TEST 15: Meta refresh redirect (security test) -->
<!-- PASS: Page redirects after 999 seconds (very bad security!) -->
<!-- FAIL: Nothing happens (meta stripped — expected) -->
<meta http-equiv="refresh" content="999;url=https://example.com">
<p>TEST 15: Meta refresh tag (page should NOT redirect — meta expected to be stripped)</p>
```
**Expected FAIL (normal/safe)**: No redirect
**Expected PASS (security concern)**: Page would redirect

---

## Results Recording Table

Copy this table and fill in after running each test:

| Test # | What It Tests | Result (PASS/FAIL/PARTIAL) | Notes |
|--------|-------------|---------------------------|-------|
| 1 | Inline styles on div | | |
| 2 | Link with target="_blank" | | |
| 3 | External image | | |
| 4 | Clickable image link | | |
| 5 | `<style>` tag | | |
| 6 | `<script>` tag | | |
| 7 | `<iframe>` | | |
| 8 | HTML form | | |
| 9 | Bootstrap classes | | |
| 10 | Styled table | | |
| 11 | Data attributes | | |
| 12 | Inline SVG | | |
| 13 | `<object>` tag | | |
| 14 | External CSS link | | |
| 15 | Meta refresh | | |

---

## Decision Matrix

Based on your results, choose the appropriate launcher:

| Test 1 ✅ | Test 2 ✅ | Test 3 ✅ | Recommended Launcher |
|----------|----------|----------|---------------------|
| PASS | PASS | PASS | `launcher-styled.html` (full experience) |
| PASS | PASS | FAIL | `launcher-styled.html` (without status image) |
| PASS | FAIL | any | `launcher-styled.html` (buttons open same tab) |
| FAIL | PASS | any | `launcher-basic.html` (unstyled links) |
| FAIL | FAIL | any | `launcher-basic.html` (fallback only) |

### What each result means for your project
- **Test 1 PASS**: You can use the beautiful styled dark card launcher
- **Test 2 PASS**: Launch button opens panel in a new tab (best user experience)
- **Test 9 PASS**: Moodle uses Bootstrap — you can use Bootstrap classes for styling
- **Test 6 FAIL**: Expected — you cannot run JavaScript in Moodle (why we use link-out)
- **Test 7 FAIL**: Expected — you cannot embed iframes (why we use link-out)
