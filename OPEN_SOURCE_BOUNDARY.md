# Open-Source Boundary

WarmDiet Platform uses an open-core strategy.

## Open-Source Edition

The open-source repository contains the manually operated product surface:

- hospital / doctor console
- family H5 manual meal entry
- patient authorization flow
- basic health reports and demo data
- Express / SQLite demo backend
- Cloudflare demo Worker

This edition is intended for product evaluation, local development, demos, and community collaboration.

## Private Enterprise / AI Core

The following capabilities are private and must not be committed to the public repository:

- XiaoAI / Xiaozhi / hardware voice integrations
- MCP bridge code
- AI meal recognition
- proprietary prompt chains
- model orchestration and scoring logic that is not explicitly released
- production deployment secrets
- real patient data
- private databases and database backups
- internal business, financing, or customer documents

Suggested private locations:

```text
private/
enterprise/
ai-core/
prompts/private/
docs/private/
```

## Repository Hygiene

The repository includes several layers of filtering:

- `.gitignore` prevents new private files from being added accidentally.
- `.dockerignore` keeps private files out of container build contexts.
- `.gitattributes` excludes private files from source archives.

These filters do not erase files that were already committed in Git history.

Before making a repository public, create a clean public repository or rewrite history to remove any previously committed secrets, private code, databases, and internal documents.

## Current Public Demo Scope

The Cloudflare demo API is intentionally lightweight. It exists to let users experience the hospital and family flows without publishing the private AI/hardware implementation.

The family H5 public demo supports manual meal and health data workflows only. Voice-driven meal logging and AI Core automation are reserved for the private Enterprise edition.
