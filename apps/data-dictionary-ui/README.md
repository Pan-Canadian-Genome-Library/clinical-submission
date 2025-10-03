# PCGL DACO UI

Client application for the Pan Canadian Genome Library Data Dictionary

## Local Development

To run the PCGL DACO UI directly:

1. Make sure all npm dependencies have been installed: `pnpm i`
2. Create a `.env` from the `.env.schema` file and fill in variables
3. From this directory (`./apps/data-dictionary-ui`) run: `pnpm dev`

This will start the [Vite](https://vitejs.dev/) dev server and host the the UI at: http://localhost:5174

### Environment Variables

These environment variables can be used for local development to change the behaviour of the UI. All env variables are optional and are undefined by default.

To use environment variables, copy the file `.env.schema` to `.env` and modify any of the provided values.

| Name                          | Description                                     | Type     |
| ----------------------------- | ----------------------------------------------- | -------- |
| `API_URL`                     | URL pointing to the Dictionary Manager service. | `string` |
| `VITE_PROXY_API_URL`          | Proxy URL                                       | `string` |
| `VITE_BASE_DICTIONARY_SCHEMA` | Target dictionary to be displayed on the UI     | `string` |
