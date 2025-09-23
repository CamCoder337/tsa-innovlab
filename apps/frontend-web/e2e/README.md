# End-to-End Testing with Playwright

This directory contains end-to-end tests for the TSA InnovLab frontend application using Playwright.

## Getting Started

### Prerequisites

- Node.js 16+
- Yarn or npm
- A running instance of the application (frontend and backend)

### Installation

1. Install dependencies:

   ```bash
   yarn install
   # or
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### Run all tests

```bash
yarn test:e2e
# or
npm run test:e2e
```

### Run tests in UI mode

```bash
yarn test:e2e:ui
```

### Run tests in debug mode

```bash
yarn test:e2e:debug
```

### Run tests in a specific browser

```bash
# Chrome
yarn test:e2e:chrome

# Firefox
yarn test:e2e:firefox

# WebKit (Safari)
yarn test:e2e:webkit
```

### View test report

After running tests, you can view the HTML report with:

```bash
yarn test:e2e:report
```

## Writing Tests

- Test files should be named with the `.spec.ts` extension
- Use the `test` and `expect` functions from `@playwright/test`
- Group related tests with `test.describe`
- Use `test.beforeEach` and `test.afterEach` for setup and teardown
- Use page objects or test utilities to avoid code duplication

## Test Data

- For test users and other test data, use the `test-utils.ts` file
- Consider using environment variables for sensitive data like credentials

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Reliable Selectors**: Prefer test IDs or ARIA roles over CSS selectors
3. **Wait for Elements**: Use `page.waitForSelector` or `page.waitForURL` to wait for elements to be ready
4. **Clean Up**: Always clean up test data after tests complete
5. **Parallel Execution**: Write tests that can run in parallel when possible

## Debugging

- Use `test.only` to run a specific test
- Use `test.slow()` to mark slow tests
- Use `test.fixme()` to temporarily skip failing tests
- Use `test.setTimeout()` to adjust the timeout for specific tests

## CI/CD Integration

For CI/CD integration, you can use the following command to run tests in headless mode:

```bash
PLAYWRIGHT_HEADLESS=true yarn test:e2e
```

## More Information

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
