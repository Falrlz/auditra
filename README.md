# Auditra

**Never manage audit approvals manually again.**

Have you ever struggled with tracking audit documents, handling manual review flows, and ensuring compliance across multiple stakeholders?

**Auditra** helps you automate, parse, review, and approve audit forms (specifically the A10 Pre-Engagement forms) seamlessly through an interactive wizard and a multi-tier role-based approval dashboard.

## Live Demo

(Link will be available upon deployment)

## Preview

### Welcome Page
![Welcome Page](docs/screenshoot-welcome.png)

### Dashboard Overview
![Dashboard Overview](docs/screenshoot-dashboard.png)

### Form Prefill (A10)
![Form Prefill](docs/screenshoot-prefill.png)


## What It Does

- **A10 Pre-Engagement Wizard** → Multi-step interactive wizard to create, edit, and evaluate client acceptance and continuance forms (SA 210, Going Concern, Integrity, and Independence).
- **D10 Materiality & Significant Accounts** → Interactive materiality calculator (Overall Materiality, Performance Materiality, Tolerable Error) and mapping of Significant Accounts with audit assertions.
- **ODS File Parser** → Instantly pre-fill A10 audit forms from an uploaded `a10.ods` file without external heavyweight library dependencies.
- **Multi-Tier Role-Based Workflow** → Comprehensive dashboard mapping approval flows through Anggota, Ketua Tim, Supervisor, and Partner roles.
- **Review & Feedback Loop** → Rejection capability with detailed reason feedback, allowing Anggota to correct and resubmit drafts.
- **Traceable Log** → Transparent log tracking of preparer, reviewer, and final approver details for each audit form.

## How It Works

### 1. Form Generation & ODS Upload
- **A10**: Anggota uploads an `a10.ods` spreadsheet or manually starts the wizard to populate fields mapped directly from the workbook cells.
- **D10**: Anggota starts the D10 planning materiality wizard for the selected client and fills out calculations.

### 2. Form Editing & Submission
- Anggota fills out and saves the multi-step form as a draft.
- Once finished, the Anggota submits the form for review, which locks editing and sets the status to `pending_ketua_tim`.

### 3. Verification & Decision by Ketua Tim
- Ketua Tim reviews the form in their dashboard queue and can either approve (escalating to `pending_supervisor`) or reject (returning status to `rejected` with feedback notes).

### 4. Verification by Supervisor
- Supervisor checks the escalated form and can either approve (escalating to `pending_partner`) or reject (returning to `rejected`).

### 5. Final Sign-off by Partner
- Partner performs final validation and signs off on the form, updating the status to `final_approved`.

## Key Features

### Multi-Role Authorization
- Strict RBAC using custom Laravel Middleware (`role`).
- Role-specific dashboards hiding or showing administrative tools depending on authorization levels.

### Dynamic React Wizard
- Multi-step interactive wizard using Inertia.js and Headless UI.
- Real-time client-side validations and field mapping for complex section data.
- Responsive layout with desktop table views and mobile card lists.
- **Enhanced Form A10 UI/UX**:
  - Clean initial state without hardcoded default dates (`'4/25/2024'`) or initials (`'SP'`).
  - Standardized short input placeholders (e.g., `"DD/MM/YYYY"` for dates).
  - Consistent boxed designs for inputs (such as matching border and background styles for initials and date inputs).
  - Smooth interactive transitions with focus rings (`focus:ring-2 focus:ring-blue-500/20`) and active scale-down feedback for buttons (`active:scale-[0.99]` and `active:scale-[0.98]`).
  - Standard compliance opening paragraphs for Section III (Integritas Manajemen) and Section IV (Independensi Kantor).

### Structured JSON Storage
- Audit forms data structured into detailed JSON objects (`section_data`) and stored inside a single Eloquent field utilizing database casts.
- Flexibility to accommodate different sections of standard Pre-Engagement sheets without database migration overhead.

### Automated ODS Processing
- Custom ZIP & XML parser implementation (`OdsParser`) without external heavyweight spreadsheet library dependencies.
- Translates sheet structure directly to application state variables.

## Project Architecture

```
auditra/
├── app/                        # Backend Application Core
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuditFormController.php # Core workflow, state updates & ODS parsing
│   │   │   └── ProfileController.php   # User profile management controller
│   │   └── Middleware/
│   │       └── RoleMiddleware.php      # Role-based access control router filter
│   ├── Models/
│   │   ├── AuditForm.php       # AuditForm Eloquent Model & JSON casts
│   │   └── User.php            # User Model with helper methods for roles
│   └── Services/
│       └── OdsParser.php       # Low-level XML-based ODS parser service
│
├── bootstrap/                  # Framework bootstrapping & route configuration
│
├── config/                     # Application-wide configuration files
│
├── database/                   # Database files
│   ├── migrations/             # Schema definitions (Users, Cache, AuditForms)
│   └── seeders/
│       └── DatabaseSeeder.php  # Database seeding for roles, users, and draft A10 form
│
├── docs/                       # Technical guide
│
├── routes/                     # Application routing definitions
│   ├── web.php                 # Core web and role-protected workflow routes
│   └── auth.php                # Authentication routes (Laravel Breeze)
│
├── resources/                  # Frontend Assets & React Application
│   ├── js/
│   │   ├── Components/             # React components (Form inputs, UI elements)
│   │   │   └── AuditFormWizard.jsx # Multi-step A10 wizard controller
│   │   ├── Pages/                  # Page view components
│   │   │   ├── Dashboard.jsx       # Role-customized application dashboard
│   │   │   └── Welcome.jsx         # Landing page view
│   │   └── app.jsx                 # React/Inertia frontend entry point
│   └── css/
│       └── app.css             # Base styles & tailwind configurations
│
├── public/                     # Publicly exposed static assets
│
├── package.json                # Frontend package dependencies (Vite, Tailwind, Inertia)
├── composer.json               # Backend composer dependencies (Laravel, Breeze, Sanctum)
├── vite.config.js              # Vite compiler configuration
└── README.md                   # System documentation

## Database Schema

Auditra uses a relational database structure designed to manage user authentication, role-based access control, and audit form approval workflows. Below is a detailed explanation of the primary tables and their relationships.

### Database Relationship Diagram

```mermaid
erDiagram
    User ||--o{ AuditForm : "prepares"
    User ||--o{ AuditForm : "reviews"
    User ||--o{ AuditForm : "approves"

    User {
        bigint id PK
        string name
        string email "unique"
        string password
        string role "anggota, ketua_tim, supervisor"
        timestamp created_at
        timestamp updated_at
    }
    AuditForm {
        bigint id PK
        string client_name
        string book_year
        string schedule
        string status "draft, pending_approval, etc."
        text reject_reason
        longtext section_data "JSON formatted questionnaire"
        bigint preparer_id FK
        bigint reviewer_id FK
        bigint approver_id FK
        timestamp created_at
        timestamp updated_at
    }
```

### Table Definitions

#### 1. `users` Table
Stores user accounts and their respective role inside the system.
* **`id`** (`unsigned big integer`, Primary Key): Unique identifier for each user.
* **`name`** (`string`): Full name of the user.
* **`email`** (`string`, Unique): Email address used for authentication.
* **`password`** (`string`): Hashed password.
* **`role`** (`string`, Default: `'staff'`): The global system role defining administrative permission levels. Available values:
  * `admin`: Has global management capabilities (create users, create clients, delete records).
  * `partner`: Can assign engagement teams (anggota, ketua_tim, supervisor, partner) to client perikatan.
  * `manager`: General manager role (typically assigned as a supervisor).
  * `staff`: General staff role (typically assigned as anggota or ketua_tim).
* **`created_at` / `updated_at`** (`timestamp`): Auto-managed Laravel timestamps.

#### 2. `audit_forms` Table
Stores the audit forms, their workflow approval statuses, and parsed questionnaire data.
* **`id`** (`unsigned big integer`, Primary Key): Unique identifier for the audit form.
* **`client_id`** (`unsigned big integer`, Foreign Key -> `clients.id`): References the client company associated with the audit.
* **`form_type`** (`string`): The type of the form (either `A10` or `D10`).
* **`status`** (`string`, Default: `'draft'`): Current workflow approval state:
  * `draft`: Form is being draft-saved by `anggota` and not yet submitted.
  * `pending_ketua_tim`: Submitted by `anggota` and waiting for review by `ketua_tim`.
  * `pending_supervisor`: Approved by `ketua_tim`, waiting for review by `supervisor`.
  * `pending_partner`: Approved by `supervisor`, waiting for final sign-off by `partner`.
  * `final_approved`: Fully approved by `partner` (final active state).
  * `rejected`: Rejected by any reviewer (sent back to `anggota` with a feedback reason).
* **`reject_reason`** (`text`, Nullable): Text containing explanation or feedback from reviewer if the form is rejected.
* **`section_data`** (`longtext` / `json`, Nullable): Stores the entire detailed audit questionnaire answers. It uses Laravel's array casting to cast JSON string directly to/from PHP array. It contains structured fields mapped from `a10.ods`:
  * **For A10**: `section_1` (SA 210), `section_2_a` to `section_2_h` (Data Klien), `section_3` (Integritas), `section_4` (Independensi), `section_5` (Prosedur Lain), `section_6` (Bisnis Kecil), and `section_b` (Kesimpulan).
  * **For D10**: `materiality` parameters (Benchmark, percentage, etc.), `qualitative_questions`, and `accounts` list (Significant accounts and assertions).
* **`preparer_id`** (`unsigned big integer`, Foreign Key -> `users.id`): References the user who prepared/created the form. Cascade on delete.
* **`reviewer_id`** (`unsigned big integer`, Foreign Key -> `users.id`, Nullable): References the user who reviewed the form. Null on delete.
* **`approver_id`** (`unsigned big integer`, Foreign Key -> `users.id`, Nullable): References the user who gave final sign-off. Null on delete.
* **`created_at` / `updated_at`** (`timestamp`): Auto-managed Laravel timestamps.

## Technology Stack

### Backend
- **Laravel Framework** → Core backend PHP MVC framework
- **Inertia.js** → Connects Laravel backend and React frontend without building a separate API
- **MySQL / SQLite** → Relational database for persistent storage

### Frontend
- **React.js** → Core library for building interactive user interfaces
- **Tailwind CSS** → Utility-first CSS styling framework
- **Headless UI** → Unstyled, accessible UI components for React
- **Axios** → HTTP client for file uploads and JSON requests

### Build Tools & Version Control
- **Vite** → Fast frontend development server and compiler
- **Composer** → PHP package dependency manager
- **NPM** → Node.js package manager

## Quick Start

### 1. Clone Repo
```bash
git clone https://github.com/Falrlz/auditra.git
cd auditra
```

### 2. Setup Environment
Set up your database details inside `.env` (the copy from `.env.example` is handled automatically during setup, but database configurations must be adjusted manually).

### 3. Run Application Setup
Automates Composer installs, environment file setups, key generation, database migrations, NPM installs, and frontend building:
```bash
composer run setup
```

### 4. Start Development Servers
Starts the Laravel server, queue listener, tail log listener, and Vite compiler concurrently:
```bash
composer run dev
```

### Pre-seeded User Accounts
For testing the role-based dashboard views and multi-tier approval flows, you can log in using the following accounts:
- **Admin**: `linda@example.com` (Password: `password`, Initial: `LIN`) - Global administrator (can manage all users and clients).
- **Partner**: `sandra@example.com` (Password: `password`, Initial: `SAN`) - Partner role (can configure client engagement teams).
- **Supervisor / Manager**: `joko@example.com` (Password: `password`, Initial: `JOK`) - Supervisor role in the client engagement team (handles supervisor-level approvals).
- **Ketua Tim**: `saipul@example.com` (Password: `password`, Initial: `SAI`) - Ketua Tim role in the client engagement team (handles team-leader-level approvals).
- **Anggota / Staff**: `andi@example.com` (Password: `password`, Initial: `AND`) - Anggota role in the client engagement team (creates, edits, and submits A10/D10 forms).

## Environment Configuration

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=form_approval_db
DB_USERNAME=root
DB_PASSWORD=
```

## Acknowledgements

This project utilizes open standard formats and libraries:

- **Open Document Format (ODF) Specifications**  
  Used to read, structure, and process spreadsheet data from `.ods` workbooks.
- **Laravel Framework & Breeze Starter Kit**  
  For supplying robust authentication templates, routing middleware, and DB ORM layers.
- **Inertia.js & React Core Teams**  
  For enabling cohesive single-page application experiences directly integrated into Laravel.

## Disclaimer

- This project is intended for administrative audit flow management and evaluation purposes.  
- Standard compatibility with all custom `.ods` layout formats is not guaranteed; layout structures must match the expected columns and fields.
