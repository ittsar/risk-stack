"""Bootstrap data helpers for the risk application."""

FRAMEWORK_CATALOG = [
    {
        "code": "NIST-CSF",
        "name": "NIST Cybersecurity Framework",
        "description": "Framework for managing cybersecurity risk.",
        "controls": [
            {
                "reference_id": "NIST-PR.AC-1",
                "name": "Identity Management",
                "description": "Identify and manage users, devices, and other assets that require access.",
            },
            {
                "reference_id": "NIST-PR.AC-7",
                "name": "Privileged Access MFA",
                "description": "Enforce multi-factor authentication for privileged account access.",
            },
            {
                "reference_id": "NIST-DE.CM-7",
                "name": "Monitor Unauthorized Connections",
                "description": "Monitor network connections to detect unauthorized activity.",
            },
        ],
    },
    {
        "code": "ISO-27001",
        "name": "ISO/IEC 27001",
        "description": "Information security management system standard.",
        "controls": [
            {
                "reference_id": "ISO-A.6.1.1",
                "name": "Information Security Roles",
                "description": "Assign information security responsibilities.",
            },
            {
                "reference_id": "ISO-A.9.2.3",
                "name": "Privileged Access Management",
                "description": "Manage and review privileged access rights on a regular basis.",
            },
            {
                "reference_id": "ISO-A.12.6.1",
                "name": "Technical Vulnerability Management",
                "description": "Establish processes to identify and remediate technical vulnerabilities.",
            },
        ],
    },
    {
        "code": "PCI-DSS",
        "name": "PCI DSS",
        "description": "Payment card industry data security standard.",
        "controls": [
            {
                "reference_id": "PCI-7.1",
                "name": "Restrict Access",
                "description": "Limit access to cardholder data to individuals whose job requires it.",
            },
            {
                "reference_id": "PCI-8.3",
                "name": "Multi-factor Authentication",
                "description": "Protect all remote network access by multi-factor authentication.",
            },
            {
                "reference_id": "PCI-10.6",
                "name": "Log Review",
                "description": "Review logs and security events daily.",
            },
        ],
    },
    {
        "code": "HIPAA",
        "name": "HIPAA Security Rule",
        "description": "Safeguards to protect electronic health information.",
        "controls": [
            {
                "reference_id": "HIPAA-164.308(a)(1)(ii)(D)",
                "name": "Activity Review",
                "description": "Regularly review records of system activity such as audit logs.",
            },
            {
                "reference_id": "HIPAA-164.312(d)",
                "name": "Person or Entity Authentication",
                "description": "Implement procedures to verify that a person seeking access is the one claimed.",
            },
            {
                "reference_id": "HIPAA-164.308(a)(3)(ii)(B)",
                "name": "Workforce Clearance",
                "description": "Implement procedures to ensure appropriate workforce access.",
            },
        ],
    },
]
