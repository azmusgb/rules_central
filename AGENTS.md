
**Commit Messages**
- Keep under 50 chars for title
- Use present tense ("Add feature" not "Added feature")
- Begin with a short area prefix (`docs:`, `feat:`, `fix:`)
- Include brief details in body when helpful

**Branch Names**
- Use `topic/short-description` format
- Avoid working directly on `main`

**Pull Requests**
- Title: Summarize change
- Description:
  - List key changes
  - Include test results (`pytest -v` output)
  - Include screenshot for UI updates
  - Note any migrations needed
  - Mention docs/README updates
  - Link relevant issues

**Testing**
- Run `pytest -v` on Python changes
- Verify full functionality after changes
- Check cross-browser compatibility for frontend
- Run `npm test` if JavaScript tests are present
- Ensure linting passes

**Frontend Builds**
- Run `npm run build:css` when:
  - SCSS files change
  - Tailwind config updates
  - Adding new UI components

**Documentation**
- Update in 3 places:
  1. README.md
  2. templates/documentation.html
  3. Relevant docstrings
- Keep language clear and concise
- Include examples for complex features
- Document new features the same day they're merged

**Workflow**
1. Make changes
2. Run tests
3. Update docs
4. Commit (with good message)
5. Open PR with details
6. Verify build
7. Merge when green

**Golden Rules**
- Never break main branch
- All tests must pass
- Docs always match code
- CSS builds before commits
- One logical change per PR
