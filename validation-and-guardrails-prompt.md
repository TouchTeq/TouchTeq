

# Website Form Validation and Guardrails Prompt

Copy everything below and provide it to your developer or development AI.

---

## Prompt Begins Here

---

I need you to implement strict form validation and input guardrails on every form across the website. This is a B2B industrial engineering website. The forms capture inquiries from plant managers, project engineers, procurement officers, and HSE professionals. The data needs to be clean, valid, and usable from the moment it is submitted.

There are two form types on the site. The extended form on the main Contact Us page and shorter CTA forms on individual service pages. The validation rules below apply to both. If a field exists on a form, these rules govern it. No exceptions.

---

### General Rules That Apply to Every Field

- All validation must be enforced on both the front end (client-side) and the back end (server-side). Front-end validation alone is not sufficient. Never trust client-side validation as the only layer of protection.
- All text inputs must be sanitised to strip or escape HTML tags, script tags, and SQL injection patterns before the data is stored or emailed. No raw user input should ever be rendered or executed.
- All required fields must display a clear, specific error message if the user attempts to submit the form without completing them. The error message must appear next to the relevant field, not as a generic alert at the top of the page.
- Do not allow the form to be submitted if any required field fails validation. The submit button should either be disabled until all required fields pass, or the form should prevent submission and highlight all fields that need attention.
- All error messages must be written in plain, professional language. No developer jargon, no error codes, no system messages exposed to the user.
- Whitespace-only entries must not be accepted as valid input for any field. A field filled with spaces is not a completed field.
- Leading and trailing whitespace should be trimmed automatically on all text fields before validation and storage.

---

### Field-by-Field Validation Rules

---

**1. Full Name**

| Rule | Requirement |
|---|---|
| Required | Yes |
| Minimum characters | 2 |
| Maximum characters | 80 |
| Allowed characters | Letters (uppercase and lowercase), spaces, hyphens, apostrophes, and periods only |
| Blocked characters | Numbers, special characters (@ # $ % ^ & * ! ? = + etc.), emojis |
| Validation | Must contain at least two characters that are letters. Must not be purely spaces, hyphens, or punctuation |
| Error message (empty) | "Please enter your full name" |
| Error message (invalid characters) | "Name can only contain letters, spaces, hyphens, and apostrophes" |
| Error message (too short) | "Name must be at least 2 characters" |
| Error message (too long) | "Name must not exceed 80 characters" |
| Notes | Must accept international characters and accented letters (e.g., e with an accent, u with an umlaut, n with a tilde). Do not restrict to ASCII only. Southern Africa has diverse naming conventions. Allow for compound names, hyphenated surnames, and names with apostrophes (e.g., O'Brien) |

---

**2. Company Name**

| Rule | Requirement |
|---|---|
| Required | Yes |
| Minimum characters | 2 |
| Maximum characters | 120 |
| Allowed characters | Letters, numbers, spaces, hyphens, apostrophes, periods, ampersands, commas, parentheses, and forward slashes |
| Blocked characters | Script tags, HTML tags, emojis, and characters commonly used in injection attacks |
| Validation | Must contain at least two characters that are letters. Must not be purely numbers, spaces, or punctuation |
| Error message (empty) | "Please enter your company name" |
| Error message (invalid) | "Please enter a valid company name" |
| Error message (too short) | "Company name must be at least 2 characters" |
| Error message (too long) | "Company name must not exceed 120 characters" |
| Notes | Company names legitimately contain numbers (e.g., "3M"), ampersands (e.g., "Smith & Jones"), parentheses (e.g., "(Pty) Ltd"), and forward slashes (e.g., "Division/Unit"). Do not block these. The key restriction is that the field must not accept a purely numeric entry and must not accept script or HTML injection |

---

**3. Job Title / Role**

| Rule | Requirement |
|---|---|
| Required | No (optional field, only on the extended Contact Us form) |
| Minimum characters | 2 (if filled) |
| Maximum characters | 80 |
| Allowed characters | Letters, numbers, spaces, hyphens, ampersands, periods, commas, and forward slashes |
| Blocked characters | Script tags, HTML tags, emojis |
| Validation | If filled, must contain at least two characters that are letters |
| Error message (invalid) | "Please enter a valid job title" |
| Error message (too long) | "Job title must not exceed 80 characters" |
| Notes | Job titles can contain numbers (e.g., "C&I Engineer Level 3") and ampersands (e.g., "Health & Safety Manager"). Allow for this |

---

**4. Email Address**

| Rule | Requirement |
|---|---|
| Required | Yes |
| Minimum characters | 6 (e.g., a@b.co) |
| Maximum characters | 254 (per RFC 5321 specification) |
| Format validation | Must match a standard email format: local-part@domain.tld. Must contain exactly one @ symbol. Must contain at least one period after the @ symbol. The domain must contain at least two characters after the last period (e.g., .com, .co.za, .engineering). The local part (before the @) must not be empty |
| Blocked patterns | Spaces anywhere in the address. Multiple consecutive periods. @ symbol at the start or end of the address |
| Validation | Apply regex validation for email format on the front end. On the back end, validate format and optionally perform DNS MX record lookup on the domain to confirm it is a real mail domain |
| Error message (empty) | "Please enter your email address" |
| Error message (invalid format) | "Please enter a valid email address (e.g., name@company.co.za)" |
| Notes | Do not restrict to specific domains. Clients will submit from corporate domains, personal domains, and webmail providers. Accept all valid formats. Consider implementing a confirmation field ("Confirm email address") on the extended Contact Us form to catch typos |

---

**5. Phone Number**

| Rule | Requirement |
|---|---|
| Required | Yes |
| Minimum characters | 7 (to accommodate short local numbers) |
| Maximum characters | 20 (to accommodate international formats with country code and spaces) |
| Allowed characters | Numbers (0-9), the plus symbol (+ for international dialling codes), hyphens, spaces, and parentheses |
| Blocked characters | Letters (A-Z, a-z), special characters (@ # $ % ^ & * ! ? = etc.), emojis |
| Validation | Must contain at least 7 digits (not counting spaces, hyphens, or the plus symbol). Must not be all zeros. Must not contain letters |
| Error message (empty) | "Please enter your phone number" |
| Error message (invalid) | "Please enter a valid phone number using numbers only (e.g., +27 12 345 6789)" |
| Error message (too short) | "Phone number must contain at least 7 digits" |
| Notes | Must accept South African formats (+27 11 234 5678, 011 234 5678, 0112345678) and international formats for clients in Mozambique, Botswana, Namibia, Zimbabwe, and elsewhere. Allow the plus symbol at the start for international dialling codes. Allow spaces, hyphens, and parentheses for formatting, but strip them before storage so the stored value is digits only (with optional leading plus sign). Consider adding placeholder text in the field: "+27 12 345 6789" |

---

**6. Service Required (Dropdown)**

| Rule | Requirement |
|---|---|
| Required | Yes |
| Input type | Dropdown select menu (not a free-text field) |
| Default value | "Select a service" (placeholder, not a valid selection) |
| Valid options | Fire and Gas Detection Systems, Control and Instrumentation (C&I), Industrial Electrical Engineering, Hazardous Area Classification, Design and Engineering, Installation and Commissioning, Maintenance and Support, Compliance Audit or Inspection, Training, Other |
| Validation | A valid option from the list must be selected. The default placeholder value must not be accepted as a valid submission |
| Error message | "Please select the service you require" |
| Notes | On service page CTA forms, this field can be pre-populated based on the page the form sits on (e.g., if the form is on the Hazardous Area Classification page, this field defaults to "Hazardous Area Classification"). The user should still be able to change the selection if they want a different service. The value submitted must match one of the predefined options exactly. Do not accept values that have been tampered with or injected on the client side. Validate the submitted value against the allowed list on the server side |

---

**7. Project Stage (Dropdown)**

| Rule | Requirement |
|---|---|
| Required | No (optional, only on the extended Contact Us form) |
| Input type | Dropdown select menu |
| Default value | "Select project stage" (placeholder) |
| Valid options | Early feasibility or concept, FEED or front-end engineering, Detail design, Ready for construction or installation, Operational facility requiring support, Urgent or emergency requirement |
| Validation | If a selection is made, it must match one of the predefined options. Validate on the server side |
| Error message | "Please select a valid project stage" |

---

**8. Project Location**

| Rule | Requirement |
|---|---|
| Required | No (optional) |
| Minimum characters | 2 (if filled) |
| Maximum characters | 120 |
| Allowed characters | Letters, numbers, spaces, hyphens, commas, periods, and forward slashes |
| Blocked characters | Script tags, HTML tags, emojis |
| Validation | If filled, must contain at least two characters that are letters |
| Error message (invalid) | "Please enter a valid project location" |
| Error message (too long) | "Location must not exceed 120 characters" |
| Notes | Users may enter a city, a province, a country, or a combination (e.g., "Secunda, Mpumalanga" or "Maputo, Mozambique"). Allow flexible entry |

---

**9. Estimated Timeline (Dropdown)**

| Rule | Requirement |
|---|---|
| Required | No (optional, only on the extended Contact Us form) |
| Input type | Dropdown select menu |
| Default value | "Select timeline" (placeholder) |
| Valid options | Immediate or urgent, Within 1 month, 1 to 3 months, 3 to 6 months, 6 months or more, Not yet defined |
| Validation | If a selection is made, it must match one of the predefined options. Validate on the server side |
| Error message | "Please select a valid timeline" |

---

**10. Message / Project Details (Text Area)**

| Rule | Requirement |
|---|---|
| Required | Yes |
| Minimum characters | 20 |
| Maximum characters | 3000 |
| Allowed characters | Letters, numbers, standard punctuation (periods, commas, colons, semicolons, question marks, exclamation marks, hyphens, apostrophes, quotation marks, forward slashes, parentheses, ampersands), spaces, and line breaks |
| Blocked content | HTML tags, script tags, URLs with embedded scripts, and executable code patterns |
| Validation | Must contain at least 20 characters. Must contain at least two words. Must not be purely numbers, punctuation, or repeated characters |
| Character counter | Display a live character counter below the text area showing "X / 3000 characters" so the user can see how much space they have remaining |
| Error message (empty) | "Please describe your requirements" |
| Error message (too short) | "Please provide at least 20 characters describing your requirements" |
| Error message (too long) | "Message must not exceed 3000 characters" |
| Placeholder text | "Tell us about your project, the service you need, and any specific requirements or timelines" |
| Notes | Allow URLs (clients may want to reference a project or send a link to specifications) but sanitise them to prevent script injection. Allow line breaks so users can format their message with paragraphs. Do not strip line breaks during display or storage |

---

**11. File Upload**

| Rule | Requirement |
|---|---|
| Required | No (optional, only on the extended Contact Us form) |
| Accepted file types | PDF, DOC, DOCX, XLS, XLSX, DWG, DXF, JPG, JPEG, PNG |
| Maximum file size | 25 MB per file |
| Maximum number of files | 3 |
| Validation | Validate file type by both file extension and MIME type (do not rely on extension alone). Reject files that do not match the accepted types. Reject files that exceed the size limit. Reject uploads that exceed the maximum file count |
| Error message (wrong type) | "Accepted file types: PDF, DOC, DOCX, XLS, XLSX, DWG, DXF, JPG, PNG" |
| Error message (too large) | "File size must not exceed 25 MB" |
| Error message (too many) | "You can upload a maximum of 3 files" |
| Label text | "Upload specifications, drawings, or project documents (optional)" |
| Notes | Uploaded files must be scanned or checked for malicious content before being stored or forwarded. Do not execute or render uploaded files on the server. Store uploaded files in a secure location that is not directly accessible via a public URL. Rename files on the server to prevent path traversal attacks. Include the original filename in the notification email for reference |

---

### Spam and Bot Prevention

| Rule | Requirement |
|---|---|
| CAPTCHA | Implement Google reCAPTCHA v3 (invisible) or a similar non-intrusive bot detection mechanism on every form. Do not use a visible CAPTCHA puzzle unless the invisible version fails to control spam, as it creates friction for legitimate users |
| Honeypot field | Add a hidden form field (not visible to human users but visible to bots) that must remain empty for the submission to be accepted. If the honeypot field contains any value, reject the submission silently |
| Rate limiting | Limit form submissions to a maximum of 3 submissions per IP address per 10-minute window. If exceeded, display the message: "Too many submissions. Please wait a few minutes and try again." |
| Time-based validation | Track the time between page load and form submission. If the form is submitted in under 3 seconds (indicating a bot), reject the submission silently or flag it for review |

---

### Form Submission Behaviour

| Rule | Requirement |
|---|---|
| Success message | After successful submission, display a confirmation message on the same page or redirect to a dedicated thank-you page. The message should read: "Thank you for your inquiry. A member of our engineering team will review your submission and respond within one business day. If your request is urgent, please call us directly on +27 [phone number]." |
| Email notification | Every form submission must trigger an email notification to the designated internal recipient(s) (e.g., info@touchteq.co.za or the relevant team inbox). The email must contain all submitted field data, formatted clearly, with the subject line: "New Website Inquiry: [Service Required] from [Company Name]" |
| Auto-response email | Send an automated confirmation email to the person who submitted the form. The email should confirm that the inquiry has been received, restate the information they submitted, and provide contact details and expected response time. This email should come from a monitored address, not a no-reply address |
| Data storage | All form submissions must be stored in a database or CRM, not only sent via email. Email delivery can fail. The stored record serves as a backup and enables reporting |
| Duplicate submission prevention | After a successful submission, prevent the same form from being submitted again by the same user within a 5-minute window (e.g., by disabling the submit button after the first successful submission or by detecting duplicate content within the time window) |

---

### Accessibility Requirements

| Rule | Requirement |
|---|---|
| Labels | Every form field must have a visible label. Do not rely on placeholder text as the only label, as it disappears when the user starts typing |
| Tab order | The form must be navigable using the keyboard Tab key in a logical order from top to bottom |
| Screen reader compatibility | All fields, labels, error messages, and the submit button must be accessible to screen readers. Use proper ARIA attributes where necessary |
| Error focus | When the form fails validation on submission, focus should move to the first field that has an error so the user is directed to the problem immediately |
| Colour contrast | Error messages and field highlights must have sufficient colour contrast to be visible to users with visual impairments. Do not rely on colour alone to indicate an error. Pair the colour change with a text message and an icon |

---

### Mobile Responsiveness

| Rule | Requirement |
|---|---|
| Layout | All forms must be fully responsive and usable on mobile devices, tablets, and desktop screens |
| Input types | Use the correct HTML input types to trigger the appropriate mobile keyboard: type="email" for email fields (triggers @ symbol on mobile keyboard), type="tel" for phone number fields (triggers numeric keypad), type="text" for name and text fields |
| Touch targets | All form fields, dropdown menus, and the submit button must be large enough to tap comfortably on a mobile device. Minimum touch target size should be 44 x 44 pixels |
| File upload | The file upload field must work on mobile devices, allowing users to select files from their device storage or cloud storage |

---

### Form Locations and Configuration

**Extended Form (Contact Us Page)**
Fields: Full Name, Company Name, Job Title, Email Address, Phone Number, Service Required, Project Stage, Project Location, Estimated Timeline, Message, File Upload

**Short CTA Form (All Service Pages)**
Fields: Full Name, Company Name, Email Address, Phone Number, Service Required (pre-populated based on the page), Message

The short form must appear on every service page CTA section. The validation rules for each field are identical regardless of which form the field appears on. Do not apply weaker validation to the short form.

---

### Testing Requirements

Before deploying any form to production, test the following:

1. Submit the form with all fields empty and confirm that all required field error messages display correctly
2. Submit the form with invalid data in each field (numbers in the name field, letters in the phone field, a malformed email address) and confirm that the correct error messages appear for each field
3. Submit the form with valid data and confirm that the submission succeeds, the success message displays, the notification email is sent, the auto-response email is sent, and the data is stored
4. Submit the form with script tags and HTML injection attempts in every text field and confirm that the input is sanitised and no code is executed
5. Submit the form from a mobile device and confirm that all fields, validation, error messages, and the submission process work correctly
6. Submit the form multiple times rapidly and confirm that rate limiting and duplicate prevention work correctly
7. Test the file upload with accepted file types, rejected file types, oversized files, and multiple files to confirm all upload validation rules work correctly
8. Test the honeypot field by manually filling it in and confirming that the submission is rejected
9. Test the form with a screen reader to confirm accessibility compliance

---

## Prompt Ends Here