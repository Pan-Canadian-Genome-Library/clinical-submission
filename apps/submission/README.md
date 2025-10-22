# Pan Canadian Genome Library Data Submission Service

<img src="../../docs/img/pcgl-logo.png" height="90" align="right" />

> The Pan-Canadian Genome Library (PCGL) is a large collaborative effort to unify Canada's genome sequencing efforts. The PCGL is an open-source and open-science initiative, building upon Canadian-made foundational components and datasets, and utilizing international standards such as GA4GH to unify Canada’s human genome sequencing efforts.

This application is a wrapper around the [@overture-stack/lyric](https://github.com/overture-stack/lyric) package, enabling efficient handling and management of data submissions. It adapts Lyric's functionality to meet PCGL requirements, ensuring reliable data submission and data management.

## Getting started

### Development tools

- [PNPM](https://pnpm.io/) Dependency manager
- [Node.js](https://nodejs.org/en) Runtime environment (v20 or higher)
- [VS Code](https://code.visualstudio.com/) As recommended code editor. Plugins recommended: ESLint, Prettier - Code formatter, Mocha Test Explorer

### System Dependencies

- [Postgres Database](https://www.postgresql.org/) for data storage
- [Dictionary Manager](https://github.com/Pan-Canadian-Genome-Library/dictionary-manager) PCGL Dictionary Management and validation

> For development purpose, a `docker-compose.yml` is provided to spin up required services.

### Quickstart Development

1. Install Dependencies:

   ```
   pnpm i
   ```

2. Build the Workspace:

   ```
   pnpm build:all
   ```

3. Set Environment Variables:
   Create a `.env` file based on `.env.schema`. See Environment Variables section below.

4. Start the Server in Development Mode:

   ```
   pnpm start:dev
   ```

   Server runs on port `3030` by default.

5. Interact with API Endpoints:
   Access Swagger UI at `http://localhost:3030/api-docs/`

### Environment Variables

| Name                        | Description                                                                                                                                                                                                                                                                                                                                                                                                 | Default                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `API_HOST`                  | The domain name or URL of the API's host server. (Example: https://www.example.com)                                                                                                                                                                                                                                                                                                                         |                                        |
| `ALLOWED_ORIGINS`           | Specifies a list of permitted origins for Cross-Origin Resource Sharing (CORS). These origins, separated by commas, are allowed to make requests to the server, ensuring only trusted domains can access resources. (Example: https://www.example.com,https://subdomain.example.com)                                                                                                                        |                                        |
| `AUDIT_ENABLED`             | Ensures that any modifications to the submitted data are logged, providing a way to identify who made changes and when they were made.                                                                                                                                                                                                                                                                      | true                                   |
| `AUTH_ENABLED`              | Enable authentication middleware.                                                                                                                                                                                                                                                                                                                                                                           | false                                  |
| `AUTH_CLIENT_ID`            | Used to identify the application to the authentication server. Required when `AUTH_ENABLED` is enabled.                                                                                                                                                                                                                                                                                                     |                                        |
| `AUTH_CLIENT_SECRET`        | A secret value used to authenticate the application with the authentication server. Required when `AUTH_ENABLED` is enabled.                                                                                                                                                                                                                                                                                |                                        |
| `AUTH_PROVIDER_HOST`        | The domain or IP address of the authentication server. Required when `AUTH_ENABLED` is enabled.                                                                                                                                                                                                                                                                                                             |                                        |
| `AUTH_PROTECT_METHODS`      | Specifies a list of HTTP methods to protect, separated by commas. (Example: DELETE,GET,POST,PUT).                                                                                                                                                                                                                                                                                                           | 'DELETE,GET,POST,PUT'                  |
| `AUTHZ_ENDPOINT`            | The domain or IP address of the authorization server. Required when `AUTH_ENABLED` is enabled.                                                                                                                                                                                                                                                                                                              |                                        |
| `AUTHZ_GROUP_ADMIN`         | Authorization group configuration for determining admin group                                                                                                                                                                                                                                                                                                                                               |                                        |
| `DB_HOST`                   | Database Hostname                                                                                                                                                                                                                                                                                                                                                                                           |                                        |
| `DB_NAME`                   | Database Name                                                                                                                                                                                                                                                                                                                                                                                               |                                        |
| `DB_PASSWORD`               | Database Password                                                                                                                                                                                                                                                                                                                                                                                           |                                        |
| `DB_PORT`                   | Database Port                                                                                                                                                                                                                                                                                                                                                                                               |                                        |
| `DB_USER`                   | Database User                                                                                                                                                                                                                                                                                                                                                                                               |                                        |
| `ID_CUSTOM_ALPHABET`        | Custom Alphabet for local ID generation                                                                                                                                                                                                                                                                                                                                                                     | '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' |
| `ID_CUSTOM_SIZE`            | Custom size of ID for local ID generation                                                                                                                                                                                                                                                                                                                                                                   | 21                                     |
| `ID_USELOCAL`               | Generate ID locally                                                                                                                                                                                                                                                                                                                                                                                         | true                                   |
| `ID_MANAGER_CONFIG`         | JSON string containing configuration options for the internal ID generation system. This defines how unique identifiers should be generated for different entities within the system. Example: [{ "entityName": "Participant", "fieldName": "participantId", "prefix": "PT", "paddingLength": 8, "parentEntityName": "Study", "parentFieldName": "studyId" }]                                               |                                        |
| `ID_MANAGER_SECRET`         | A secret value utilized in the hashing process as a salt                                                                                                                                                                                                                                                                                                                                                    |                                        |
| `LECTERN_URL`               | PCGL Dictionary Management (Schema Management) URL                                                                                                                                                                                                                                                                                                                                                          |                                        |
| `LOG_LEVEL`                 | Log Level                                                                                                                                                                                                                                                                                                                                                                                                   | 'info'                                 |
| `PLURALIZE_SCHEMAS_ENABLED` | This feature automatically convert schema names to their plural forms when handling compound documents. Pluralization assumes the words are in English                                                                                                                                                                                                                                                      | true                                   |
| `SERVER_PORT`               | Server Port                                                                                                                                                                                                                                                                                                                                                                                                 | 3030                                   |
| `UPLOAD_LIMIT`              | Limit upload file size in string or number. <br>Supported units and abbreviations are as follows and are case-insensitive: <br> - b for bytes<br> - kb for kilobytes<br>- mb for megabytes<br>- gb for gigabytes<br>- tb for terabytes<br>- pb for petabytes<br>Any other text is considered as byte                                                                                                        | '10mb'                                 |

