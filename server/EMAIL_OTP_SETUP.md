# CareGrid Email OTP Authentication

CareGrid uses purpose-bound email OTPs for doctor website registration, doctor login, super-admin login, and doctor password recovery.

## Required environment variables

The server expects these variables to already exist:

- `EMAIL_USER`: Gmail address used by CareGrid Security
- `EMAIL_APP_PASSWORD`: 16-character Gmail App Password without spaces

Use a Gmail App Password, never the Gmail account's normal password.

## Security behavior

- OTPs are generated with cryptographically secure randomness.
- Only bcrypt hashes are stored in MongoDB.
- Codes expire after 5 minutes.
- A challenge is deleted after successful verification.
- A maximum of 5 incorrect attempts is allowed.
- Resending is limited to once per 60 seconds.
- API rate limits protect login, resend, and verification endpoints.
- JWT access tokens are issued only after OTP verification and expire after 8 hours.
- Registration and password-reset verification tokens are short-lived and cannot be used as login tokens.
- Resetting a doctor password invalidates all existing doctor sessions.
- Forgot-password responses do not reveal whether an email belongs to a doctor portal.

## API flow

### Doctor registration

1. `POST /api/auth/registration-otp` sends an OTP to the proposed doctor email.
2. `POST /api/auth/verify-otp` returns a short-lived `emailVerificationToken`.
3. `POST /api/doctors/register` requires that token and only creates the doctor when its email matches.

### Login

1. The doctor or super-admin login endpoint first verifies the correct password, then emails an OTP.
2. `POST /api/auth/verify-otp` returns an 8-hour access token.

### Doctor password recovery

1. `POST /api/doctors/:slug/forgot-password` sends an OTP only when the email matches that portal.
2. `POST /api/auth/verify-otp` returns a short-lived, single-use-bound reset token.
3. `POST /api/doctors/:slug/reset-password` validates the token and password confirmation, updates the password, and invalidates old sessions.

`POST /api/auth/resend-otp` resends the active purpose-bound code for `{ challengeId }`.
