## About

This project was created with [express-generator-typescript](https://github.com/seanpmaxwell/express-generator-typescript).


## Available Scripts

### `npm run dev`

Run the server in development mode.

### `npm test`

Run all unit-tests with hot-reloading.

### `npm test -- --testFile="name of test file" (i.e. --testFile=Users).`

Run a single unit-test.

### `npm run test:no-reloading`

Run all unit-tests without hot-reloading.

### `npm run build`

Build the project for production.

### `npm start`

Run the production build (Must be built first).

### `npm start -- --env="name of env file" (default is production).`

Run production build with a different env file.

## Linting

```
# lint
yarn lint

# lint tests
yarn lint:tests

# lint and fix fixable problems
yarn lint:fix

# lint (without fixing problems) and output JSON report
yarn lint:ci
```


## Additional Notes

- If `npm run dev` gives you issues with bcrypt on MacOS, you may need to run: `npm rebuild bcrypt --build-from-source`.

### Google/YouTube OAuth2

- Ensure the `HOST` environment is correctly set to, well, the host when accessing endpoints/resources hosted by the
  server. This is probably the domain name + port (e.g., `localhost:3000`, `example.com`). If you access the frontend
  when it is hosted by the server (i.e., not running the frontend locally using Vite!), then you can confirm this value
  by typing `window.location.host` in your browser's console.
