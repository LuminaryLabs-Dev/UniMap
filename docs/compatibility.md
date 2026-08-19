# Compatibility

UniMap uses **one package codebase** across Unity 6. It does not maintain separate Unity-version forks.

## Target matrix

| Unity line | Role | Package target | Runtime validation |
|---|---|---|---|
| Unity 6.3 LTS (`6000.3.x`) | Primary | yes | pending Editor smoke test |
| Unity 6.0 LTS (`6000.0.x`) | Minimum compatibility | yes | pending Editor smoke test |
| later Unity 6 Update releases | Forward smoke-test target | expected, not claimed | not yet tested |
| Unity 2022/2023 | Out of initial scope | no | not supported |

The package manifest declares `"unity": "6000.0"`, so Package Manager can consider it for the Unity 6.0+ family. That declaration is a compatibility floor, **not proof of runtime validation**.

## Why one codebase

The v0.1 implementation intentionally uses long-established Editor APIs for scene roots, GameObject/component traversal, selection, JSON serialization, Editor windows, and save dialogs. If a real Unity-version difference is later discovered, use the smallest verified version conditional rather than duplicating the project.

## Release policy

A Unity line moves from `pending` to `verified` only after all of the following pass in that Editor:

1. package imports without compile errors
2. EditMode tests pass
3. active-scene export succeeds
4. selection export succeeds
5. generated JSON passes repository/schema checks
6. the export renders in the FigJam plugin

## Current Unity support context

As of the v0.1 foundation, Unity identifies 6.3 as the current LTS and continues support for 6.0 LTS through October 2026. UniMap therefore uses 6.3 as its primary development target while retaining a 6.0 minimum until a concrete API incompatibility requires otherwise.
