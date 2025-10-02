# Pan Canadian Genome Library Clinical Submission

<img src="./docs/img/pcgl-logo.png" height="90" align="right" />

Canada boasts world-leading expertise in genomics, including developing data-sharing policies and tools. However, we lack a national strategy to aggregate, store and share Canadian data equitably, securely and sustainably. At the same time, the size and complexity of human genomics datasets and their associated clinical data are growing rapidly.

The Pan-Canadian Genome Library (PCGL) is a large collaborative effort to unify Canada's genome sequencing efforts. The PCGL is an open-source and open-science initiative, building upon Canadian-made foundational components and datasets, and utilizing international standards such as GA4GH to unify Canada’s human genome sequencing efforts.

## Repository Structure

The repository is organized with the following directory structure:

```
.
├── apps/
    ├── data-dictionary-ui
    └── submission
```

| Component                                   | Package Name             | Path     | Description                                            |
| ------------------------------------------- | ------------------------ | -------- | ------------------------------------------------------ |
| [Data Dictionary UI](apps/ui/README.md)     | @clinical-submission/ui  | apps/ui  | React SPA website for Data Dictionary UI.              |
| [Submission API](apps/submission/README.md) | @clinical-submission/api | apps/api | ExpressJS backend service for submitting clinical data |

- **apps/** - Standalone processes meant to be run.

## Local Development

### Development Tools

- [PNPM](https://pnpm.io/) Project manager
- [Node.js](https://nodejs.org/en) Runtime environment (v20 or higher)
- [VS Code](https://code.visualstudio.com/) As recommended code editor. Plugins recommended: ESLint, Prettier - Code formatter, Mocha Test Explorer, Monorepo Workspace

### System Dependencies

- This project uses Node ^20.9, Typescript ^5.5, and PNPM ^9.10, and was created using Vite 5.4.1.

### Setup

Follow these steps to install and run all dependencies, then run all applications locally. The applications will run in development mode, monitoring the code base to rebuild and restart the applications when the code is updated.

- Install PNPM: `npm i -g pnpm`
- Install dependencies: `pnpm i`
- Run dependencies: `docker compose up -d`
- Start all apps in development mode: `pnpm dev:all`
  - The Submission server will run at `http://localhost:3030`. Visit `http://localhost:3030/api-docs` for interactive swagger.
    - NOTE: Running the application should run the migrations at start, if you wish to apply migrations manually, please refer to `README` in submission for more information.
  - The Data Dictionary UI will be running at `http://localhost:5173`
  - Lectern service will run at `http://localhost:3000`. Visit `http://localhost:3000/api-docs`

## Support & Contributions

- Filing an [issue](https://github.com/Pan-Canadian-Genome-Library/clinical-submission/issues)
