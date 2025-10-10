# PCGL Data Dictionary UI

Client application for the Pan Canadian Genome Library Data Dictionary

## Local Development

To run the PCGL Data Dictionary UI directly:

1. Make sure all npm dependencies have been installed: `pnpm i`
2. Create a `.env` from the `.env.schema` file and fill in variables
3. From this directory (`./apps/data-dictionary-ui`) run: `pnpm dev`

This will start the [Vite](https://vitejs.dev/) dev server and host the the UI at: http://localhost:5174

To use environment variables locally, copy the file `.env.schema` to `.env` and modify any of the provided values.
| Name | Description | Type |
| ------------------------ | ----------------------------------------------- | -------- |
| `API_URL` | URL pointing to the Dictionary Manager service. | `string` |
| `VITE_DICTIONARY_SCHEMA` | Target dictionary to be displayed on the UI | `string` |

### Production Environment Variables

Vite statically built for production, meaning that the environment variables are not inserted at run-time and instead when the application is built. Data dictionary requires a run-time solution so to resolve this, a script was made to run when the container starts which will search through placeholder values and replace them in the docker environment. This script can be found in `docker/replace-env-script.sh` for the implementation.

If needed to add more environment variables to be used in production, please add it `.env.production` with the value the same as the key(for visual sake, the following example uses a different value). Local does not need to do this and can just use the desired value.

As an example, on production build, we defined `VITE_DICTIONARY_SCHEMA = VITE_PLACEHOLDER_VALUE` in our `.env.production`. Vite will insert `VITE_PLACEHOLDER_VALUE` as a placeholder(defined in [.env.production](https://vite.dev/guide/env-and-mode.html#env-files)), this `VITE_PLACEHOLDER_VALUE` is read in our script then the placeholder replaced by the value we provide in our docker env configuration.

> [!IMPORTANT]  
> Environment variables that we want to replace in the client MUST be prefixed with `VITE_` so that the script understands what to replace.

Example of .env.production:

```js
VITE_DICTIONARY_SCHEMA = VITE_PLACEHOLDER_VALUE;
```

Example of docker environment variables:

```yml
data-dictionary-ui:
  container_name: data-dictionary-ui
  build:
    context: .
    dockerfile: Dockerfile
    target: data-dictionary-ui
  environment:
    API_URL: http://host.docker.internal:3000

    # VITE_PLACEHOLDER_VALUE is read in the script, then uses its value pcgl_dictionary_test
    # to replace placeholder defined in .env.production VITE_PLACEHOLDER_VALUE in our built app
    VITE_PLACEHOLDER_VALUE: pcgl_dictionary_test
```
