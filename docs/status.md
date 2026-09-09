# Validation and limitations

## Baseline, September 8, 2026

The original checkout at `b8784e50d9f8fac566b67cb8b553934aa0619669` was checked with Node.js 22.22.0 and npm 10.9.4.

- `npm ci --ignore-scripts --no-audit --no-fund` completed successfully for the frontend.
- `npm test -- --runInBand --silent`: 8 passed, 29 failed, 2 skipped; 1 suite passed and 8 failed.
- Failures include stale UI text expectations and a homepage mock whose `streamMessages` signature differs from the application call. Other failing behaviors still need investigation.
- Backend integration and browser tests were not run; they require a separate Firebase test environment and can modify its data.

These results predate the repository restructuring. They are not introduced failures and do not establish that the application is ready for production.

## Cleanup scope

The application now lives at the repository root. Generated dependency trees, Firebase caches, logs, and test output have been removed from the tracked source; dependency lockfiles and test fixtures remain. Configuration examples and one set of documentation replace the duplicated READMEs.

History has not been rewritten. Generated files in older commits remain in those commits.

## Checks after restructuring

- Documentation links resolve and `git diff --check` passes.
- The frontend test run reports the same 8 passed, 29 failed, and 2 skipped tests as the original checkout.
- `npm run lint` runs but fails on an unescaped apostrophe and CommonJS test imports disallowed by the existing TypeScript lint preset. It also reports warnings.
- Backend/browser integration tests and a production build have not been verified in this pass.

## Remaining work

1. Reconcile the failing UI tests with current behavior, preserving meaningful assertions.
2. Verify the API and browser scenarios in an isolated Firebase test project.
3. Review the development authentication bypass, data rules, health diagnostics, and dependency versions before any production use.
4. Confirm the intended client/API ownership of listing and messaging operations.
