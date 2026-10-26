# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

WXT + Vue 3 + TypeScript, per the approved technical proposal. Chrome MV3 sidePanel, Node 22.13+ development. No backend.

## Users

Chinese-speaking job seekers reviewing companies, initially invited testers and later public extension users.

## Product Purpose

Gather traceable company evidence and distinguish verified risks from missing information; later compare a resume with job requirements.

## Capabilities and Constraints

Free extension, official APIs only, user-supplied keys retained locally. Keys go only to the corresponding official API for authentication when an integration is enabled. No cloud synchronization, shared keys, telemetry or paid plugin services. LingDT gateway and BOSS collection permissions remain unverified.

## Evidence on Hand

Approved requirements in docs/01-product-requirements.md and technical proposal in docs/02-technical-feasibility.md. No actual company analyses or measured model results. This initialization supplies the shell and settings only.

## Product Principles

Trace claims to evidence; abstain when evidence is insufficient; minimize data sharing; make configuration and unavailable functionality explicit.

## Operating Context

Narrow Chrome sidepanel alongside recruiting pages; separate extension settings page. Keyboard navigation, Chinese labels and text-based statuses are required by the existing PRD.
