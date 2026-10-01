# Pull request checklist

Please make sure to check the following requirements before creating a pull request:

- [ ] All pull requests must be to the [main branch](https://github.com/piratuks/invoice-builder). Pull requests to any other branch will be closed!
- [ ] Make sure your changes are based on the latest version of the [main branch](https://github.com/piratuks/invoice-builder). (Use e.g. `git fetch && git rebase origin main` to update your feature branch).
- [ ] Add or update an example when it demonstrates changed behavior or a new feature.
- [ ] Update the documentation if you introduced new behavior or changed existing behavior.
- [ ] Reference issue numbers of issues that your pull request addresses.
- [ ] Run the relevant tests, typecheck, or build and summarize the results below.
- [ ] For IPC changes, update the Electron main process, preload bridge, and shared contracts together.
- [ ] For persistence changes, review migration safety and upgrade behavior.
- [ ] For packaging or release changes, request human review and state the platform tested.

## Verification

Describe the checks run and their results.

## Risk and rollout

Describe migration, packaging, compatibility, or follow-up risks. Write `None` when not applicable.
