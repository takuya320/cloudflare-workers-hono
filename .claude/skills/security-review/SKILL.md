---
name: security-review
description: Review source code for security vulnerabilities
argument-hint: '[file path, or empty for everything]'
allowed-tools: Read Glob Grep
---

# Security Review

Read the target source code, identify vulnerabilities, and report them. Write the report in Japanese.

## Scope

- If `$ARGUMENTS` is given, review only that file or directory
- Otherwise, review all source code under `src/`

## What to look for

### Input and output

- Missing validation of user input (params, query, headers, request body)
- SQL injection, NoSQL injection
- XSS (cross-site scripting)
- Command injection, path traversal
- Internal details leaked through error messages

### Authentication and authorization

- Missing or bypassable authentication
- Missing authorization checks (IDOR, etc.)
- Flawed session management
- Missing CSRF protection

### API design

- State changes via GET requests
- Missing rate limiting
- Incorrect CORS settings (origins, methods, headers)
- Improper exposure of sensitive data

### Data handling

- Hard-coded secrets (API keys, tokens, passwords)
- Unbounded in-memory data growth
- Sensitive data written to logs
- Unsafe deserialization

### Dependencies and configuration

- Dependencies with known vulnerabilities
- Missing security headers
- Leftover debug code
- Environment configuration (e.g. development settings left in production)

## Output format

Report in this form:

1. Order findings by severity (High → Medium → Low)
2. For each finding, include:
   - Severity (High / Medium / Low)
   - Location (file path:line number)
   - The problematic code snippet
   - A concrete description of the risk
   - A suggested fix
3. End with a summary table

## Notes

- Base findings on the code, not on speculation
- Report problems that actually exist, not a generic list of best practices
- Include concrete code in each suggested fix
