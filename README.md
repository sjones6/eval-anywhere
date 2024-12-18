# Eval Anywhere

**IN PROGRESS**

Everything you need to create prompts for LLMs that are consistent, reliable, and efficient and run anywhere.

## Theory

In order to construct prompts that are consistent, reliable, and efficient, one should not think of a *prompt* as simply a bit of text fed to an LLM in the system prompt, but rather comprised of a few parts:

- system prompt
- few-shot examples
- temperature settings
- model selection
- ...

Additionally, to _know_ that prompt is effective, it's crucial to bring together these elements of a prompt together with an effective evaluation framework.

Finally, prompts that are tightly bound to a specific language or LLM provider or codebase limits their effectiveness inside of an organization.

By constructing prompts in a language-agnostic way and then publishing them in type-safe packages that can be consumed across the organization, enterprises can build out robust and re-useable components of LLMs.

## How it works

Eval Anywhere is comprised of a few pieces:

* Schema for writing structured prompts in YAML [in progress]
* Schema for structured prompt evals [in progress]
* CLI for executing evals [in progress]
* CLI for publishing prompts as language packages:
  - TypeScript [in progress]
  - Python [in progress]
  - Golang [in progress]
* a framework for adding community language packages [in progress]

## Development

TBD

## Contributing

Contributions welcome!

Please review the [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guide](./CONTRIBUTING.md).