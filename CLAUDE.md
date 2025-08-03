# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vite plugin that enables Office Add-in development using Bun. The plugin handles copying and transforming manifest.xml files during the build process, including URL replacement for different environments.

## Key Commands

- `bun run build` - Builds the plugin (runs Bun build + TypeScript declarations)
- `bun run lint` - Runs Biome linter on the source code
- `bun test` - Runs the test suite using Bun's built-in test runner
- `bun test --watch` - Runs tests in watch mode

## Architecture

The plugin follows a simple architecture:
- `src/index.ts` - Main plugin implementation that exports a Vite plugin factory function
- The plugin hooks into Vite's `generateBundle` phase to process manifest.xml files
- Uses Bun's file APIs (`Bun.file()`) for file operations
- Supports both configuration options and environment variables for URL replacement

## Development Guidelines

1. **Code Style**: Uses Biome for formatting and linting with single quotes and 2-space indentation
2. **Testing**: Tests are written using Bun's built-in test framework with mocking support
3. **Build Process**: 
   - Uses `build.mjs` for bundling with Bun
   - Generates TypeScript declarations separately using `tsconfig.types.json`
   - Removes unnecessary build artifacts post-build

## URL Replacement Logic

The plugin replaces development URLs with production URLs in manifest.xml files:
- Priority: Plugin options (`devUrl`/`prodUrl`) > Environment variables (`ADDIN_DEV_URL`/`ADDIN_PROD_URL`)
- Uses regex escaping to handle special characters in URLs
- Only performs replacement when both dev and prod URLs are provided