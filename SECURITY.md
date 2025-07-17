# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The security of this project is important to us. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Create Public Issues

Please **DO NOT** create public GitHub issues for security vulnerabilities. This could put users at risk.

### 2. Contact Us Privately

Send an email to [security@example.com] with:
- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (if you have them)

### 3. Response Timeline

We will acknowledge your report within 48 hours and provide a detailed response within 5 business days.

### 4. Disclosure Process

1. **Initial Response**: We'll confirm receipt and begin investigation
2. **Investigation**: We'll assess the vulnerability and develop a fix
3. **Resolution**: We'll release a patch and security advisory
4. **Public Disclosure**: After users have had time to update, we'll publicly disclose the vulnerability

## Security Best Practices

When using this SDK:

### Input Validation
- Always validate API responses before processing
- Never trust raw transaction data without verification
- Implement proper error handling for all verification failures

### Dependencies
- Keep dependencies updated to the latest secure versions
- Monitor for security advisories in npm packages
- Use `npm audit` regularly to check for vulnerabilities

### Environment Security
- Store sensitive data (API keys, private keys) securely
- Use environment variables for configuration
- Never commit secrets to version control

### Production Considerations
- Perform thorough security review before production use
- Implement proper logging and monitoring
- Consider rate limiting and input sanitization
- Review all decoded transaction data carefully

## Known Security Considerations

### Current Limitations
- Placeholder decoders do not perform full cryptographic verification
- No signature validation in current implementation
- Hash verification is not implemented
- Transaction replay protection is not implemented

### Recommended Enhancements for Production
- Implement full cryptographic verification
- Add signature validation
- Implement proper hash verification
- Add transaction replay protection
- Use production-grade blockchain libraries (ethers.js, bitcoinjs-lib)

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in:
- GitHub Releases
- CHANGELOG.md
- Security advisories

## Responsible Disclosure

We appreciate security researchers who help improve our project. If you report a valid security vulnerability:
- We'll acknowledge your contribution (with your permission)
- We'll work with you to understand and resolve the issue
- We'll credit you in our security advisories (if you wish)

Thank you for helping keep our project secure!