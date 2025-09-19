# Risk Stack Product Requirements (Analysis Draft)

## 1. Context
- **Purpose**: Document the current capabilities of the Risk Stack codebase to guide future planning and edits.
- **Audience**: Product managers, engineers, and compliance stakeholders evaluating enhancements.
- **Sources**: Observed Django + React implementation, existing prd.md, README, scripts, and test suite.

## 2. Current Product Snapshot
### 2.1 Functional Scope
- Risk register with CRUD endpoints and React pages (risks, projects, assets, findings).
- Framework catalogue with controls and risk mappings; CPRT importer for NIST SP 800-53.
- Controls workspace (React) to browse internal controls and map them to imported framework controls.
- Demo data seeding via management commands and helper scripts.
- Dashboard metrics (counts and severity summary) plus framework alignment view in the frontend.
- Directory autocomplete backed by the Django user model.

### 2.2 Technology Stack
- **Backend**: Django REST Framework, SQLite/PostgreSQL, token auth, management commands.
- **Frontend**: React (Create React App), context-based auth, fetch wrapper client.
- **Dev Tooling**: Docker compose stack, bootstrap/run scripts (PowerShell and Bash), go helpers for turnkey setup.

### 2.3 Data Model Highlights
- Core tables: Framework, FrameworkControl, Control, Project, Asset, Risk, Finding.
- Many-to-many relationships: risks-to-assets/controls/frameworks; controls-to-frameworks and framework controls.
- FrameworkControl records imported from CPRT datasets with element type metadata.

### 2.4 API Overview
- REST endpoints: /api/frameworks/, /api/framework-controls/, /api/controls/, /api/projects/, /api/assets/, /api/risks/, /api/findings/, /api/dashboard/, /api/users/, /api/users/suggestions/.
- Features: search and ordering filters, risk summary endpoint, control filtering by framework control ID, framework control filtering by framework code and element type.

### 2.5 Frontend Experience
- Token-based authentication stored in context.
- Navigation: Dashboard, Risks, Projects, Assets, Frameworks.
- Risks page: create/edit drawer with owner autocomplete, multi-select fields for assets/controls/frameworks.
- Frameworks page: framework chips, mapped controls table, risk table filtered by framework.

### 2.6 Developer Experience
- go.bat / go.bash default to docker compose for development, with native bootstrap/run subcommands when needed.
- scripts/bootstrap support optional tests, server start, demo seeding, CPRT import, dataset selection.
- scripts/run starts Django + React with migration toggle and Node flag handling.

## 3. User & Compliance Goals (Inferred)
- Centralize risk and control management with compliance alignment (NIST, ISO, PCI, HIPAA, SP 800-53).
- Deliver demo-ready environment to accelerate onboarding and stakeholder reviews.
- Provide auditors with traceability between risks, controls, frameworks, and owners.
- Enable risk teams to track scoring, mitigation status, and framework coverage.

## 4. Observed Strengths
- Well-structured Django models/serializers with extensive filtering and summary endpoints.
- Automated setup scripts reduce friction; CPRT importer keeps large datasets local.
- Frontend framework view reinforces compliance storytelling and risk alignment.
- Test suite covers API CRUD flows, summaries, directory suggestions, and CPRT import logic.

## 5. Gaps & Opportunities
1. **Access Control**: Auth requires login but lacks granular roles/permissions.
2. **Control Catalogue UX**: No dedicated UI for browsing imported framework controls beyond framework selection.
3. **Analytics**: Dashboard limited to counts; no trends, SLA tracking, or drill-down metrics.
4. **Workflow Automation**: Findings lack assignments/notifications; integration hooks (Jira, webhooks) referenced but not implemented.
5. **Testing Coverage**: Frontend tests minimal; no automated verification for bootstrap/go helper workflows.
6. **Documentation**: Need richer API reference, data dictionary, and importer usage guidance.
7. **Scalability Considerations**: No pagination strategy highlighted for large CPRT datasets; multi-tenant assumptions unclear.

## 6. Proposed Next Steps
### 6.1 User Experience Enhancements
- Add framework control browser/search and improved control-to-risk mapping visuals.
- Provide export/reporting options (CSV/PDF) for framework coverage.

### 6.2 Compliance & Evidence
- Support evidence attachments or linkable artifacts per control/finding.
- Introduce audit logging for key actions (risk updates, control assignments).

### 6.3 Workflow & Collaboration
- Implement role-based access (Admin, Manager, Contributor, Viewer) and ownership tracking.
- Add notification layer (email/webhook) for risk status, findings, and SLA breaches.

### 6.4 Analytics & Reporting
- Extend dashboard with time-series charts, open findings by severity, and upcoming due dates.
- Provide API endpoints for exporting summarized metrics to BI tools.

### 6.5 Developer Experience
- Document CPRT import flags, file expectations, and data retention best practices.
- Create smoke tests/CI pipeline steps validating go scripts and bootstrap workflows.

## 7. Open Questions
- Additional frameworks required (FedRAMP, SOC 2, custom corporate catalogs)?
- Target deployment scale and multi-tenant requirements?
- Authentication roadmap (SSO, OAuth, MFA) and audit retention periods?
- CPRT dataset update cadence and automation needs?
- Requirements for evidence storage security (encryption at rest, access logs)?

## 8. Appendix
- **Key Commands**
  - ./go.bash / go.bat - docker compose driven dev stack (native helpers available via subcommands).
  - ./scripts/bootstrap.sh --seed-demo-data --import-cprt-controls - manual bootstrap with data import.
  - python manage.py import_cprt_controls --file <path> - ingest CPRT dataset locally.
- **Relevant Tests**
  - ackend/risk/tests/test_api.py - covers risk CRUD, filtering, directory suggestions.
  - ackend/risk/tests/test_framework_control_import.py - validates CPRT import workflow.



