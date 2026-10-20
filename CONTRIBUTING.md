# Contributing to kwikNote

Thanks for taking the time to help. kwikNote is deliberately small, and the best contributions keep it that way.

## Project principles

- **Local-first.** Notes live in the browser. No accounts, no backend, no tracking, no telemetry.
- **Tiny dependencies.** Every new package needs a clear reason. Prefer the platform and the existing stack.
- **One job, done well.** The product is a fast Markdown notepad. Features should protect that focus.
- **Test the logic.** Pure behavior belongs in `src/lib.js` with tests next to it.

## Development setup

```bash
# fork the repository on GitHub, then
git clone https://github.com/<your-username>/kwikNote.git
cd kwikNote
npm install
npm run dev
```

Open <http://localhost:5173>. Vite reloads the page as you edit.

Requirements: Node.js 20.19+ or 22.12+ (Vite 8) and npm.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm test` | Run all Vitest tests |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Preview the production build |

## Architecture in one minute

- `src/App.jsx` holds the UI: toolbar, editor, preview, sidebar, and autosave timing.
- `src/lib.js` holds pure helpers for IDs, `localStorage`, note titles, previews, and the URL hash.
- `src/styles.css` is plain CSS. There is no CSS framework or component library.
- `src/App.test.jsx` and `src/lib.test.js` are the test suite, using Vitest and Testing Library with jsdom.

If a change touches storage or note parsing, put the logic in `lib.js` and add a unit test. If it touches interaction, add a component test in `App.test.jsx`.

## Making a change

1. Open an issue for anything larger than a typo or a small fix, so the approach can be agreed on first.
2. Create a branch: `git checkout -b fix/sidebar-search` or `feat/export-notes`.
3. Make the smallest change that solves the problem.
4. Add or update tests.
5. Run the checks:

   ```bash
   npm test
   npm run build
   ```

6. Commit with a short, imperative message, for example:

   ```text
   Fix sidebar search when a note has no title
   ```

7. Open a pull request. Describe the problem, the change, and how you verified it. Link the issue if there is one.

## Code style

- Match the surrounding code: 2-space indentation, single quotes, no semicolons, functional React components.
- Keep components readable. Extract a helper instead of adding another nested ternary.
- Use semantic HTML and keep the existing `aria-label`s and focus styles intact.
- Do not add comments unless they explain something non-obvious.

## Reporting a bug

Include:

- What you expected and what happened instead
- Steps to reproduce, including the note content or URL hash if relevant
- Browser and operating system
- Any console errors

A minimal reproduction is worth more than a long description. Please do not include private note content.

## Suggesting a feature

Start with the problem, not the solution. Explain the situation where kwikNote fell short and what a good outcome looks like. Features that add accounts, servers, or heavy dependencies are unlikely to be accepted; improvements to speed, accessibility, editing, and local note management are welcome.

## Good first issues

Small, useful places to start:

- Improve empty states and keyboard focus behavior
- Add tests for edge cases in note titles and previews
- Improve the mobile toolbar layout
- Add Markdown editing shortcuts
- Improve documentation and examples

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
