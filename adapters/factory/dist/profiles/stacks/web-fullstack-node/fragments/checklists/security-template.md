<!-- @slot supply-chain-rows -->
| C-ST-01 | `package-lock.json` is committed, and CI installs with `npm ci`. | [ ] | |
| C-ST-02 | `npm audit --omit=dev` reports no high or critical finding, or each one has a recorded exception. | [ ] | |
| C-ST-03 | No secret is in a variable that the bundler exposes to the browser. | [ ] | |

<!-- @slot input-rows -->
| C-ST-04 | Every new route has a request schema, and the server rejects a body that does not match it. | [ ] | |
| C-ST-05 | No user-supplied HTML is rendered without sanitising, and no code uses `dangerouslySetInnerHTML` on input. | [ ] | |
