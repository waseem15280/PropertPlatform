# Real Estate Platform Tech Stack Rules

## General Principles
- Backend: C# 13, .NET 10 Web API (Use Controller classes).
- Frontend: Angular 20+, Strict TypeScript, Standalone Components, Signal state management.

## C# Backend Standards
- Target Architecture: Clean Architecture (Core -> Application -> Infrastructure -> API).
- JSON Serialization: Use System.Text.Json configured for CamelCase output.
- Data Flow: Use modern C# `record` types for all DTOs and API requests.
- Auth: Use JWT bearer tokens containing claims for `Role` (Dealer or Tenant).

## Angular Frontend Standards
- Reactivity: Use `signal()`, `computed()`, and Signal inputs/outputs (`input()`, `output()`).
- Data Fetching: Use standard `HttpClient` with `provideHttpClient()`. No NgRx or external state engines.
- Flow Control: Use template control flow (`@if`, `@for`, `@switch`). Do not use structural directives.
- Tracking: Always include track expressions in `@for` blocks (e.g., `@for (item of items(); track item.id)`).
