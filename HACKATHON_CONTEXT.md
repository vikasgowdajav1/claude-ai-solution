# AI Talent Hunt Hackathon - Project Context

> This file defines the rules, constraints, objectives, and development guidelines for this hackathon.
> Every AI assistant (ChatGPT, Claude, GitHub Copilot, Cursor, etc.) must treat this document as the highest priority project context before generating code, architecture, documentation, or suggestions.

---

# Event Information

Hackathon: Version 1 AI Talent Hunt

Duration:
- 24 Hours

Submission Deadline:
- Wed 15 July
- 18:00 IST

Deliverables

Required:
1. Working application/demo
2. 3–5 minute demo video
3. Zipped codebase
4. README

---

# Primary Objective

Build an AI-powered solution that solves a REAL problem.

The judges care more about:

- solving a genuine user problem
- clear business value
- reliable demo
- teamwork
- practical AI usage

NOT:

- flashy UI
- unnecessary complexity
- overengineering

Whenever making a decision, optimize for demo value rather than technical perfection.

---

# Judging Criteria

Always optimize towards these.

## 1 Problem Clarity

Clearly identify

- user
- pain point
- why it matters
- measurable impact

Never build technology looking for a problem.

---

## 2 Solution Quality

The demo must

- work reliably
- be simple
- clearly show value
- avoid broken flows

---

## 3 Smart AI Usage

AI should accelerate work.

Use AI for

- reasoning
- summarization
- classification
- recommendations
- document generation
- workflow automation

Avoid AI simply for the sake of using AI.

---

## 4 Team Story

Everything should connect.

Problem

↓

Solution

↓

Architecture

↓

Demo

↓

Business Impact

should tell one coherent story.

---

## 5 Impact

Always quantify.

Examples

- saves 3 hours/week
- reduces manual work by 70%
- decreases response time
- improves consistency
- reduces review effort

---

# Scope Rules

Keep scope intentionally small.

Always prefer

A complete small product

over

A huge incomplete product.

If uncertain,

CUT FEATURES.

---

# Build Principles

Prefer

working

over

perfect.

Prefer

simple

over

clever.

Prefer

stable

over

complex.

---

# AI Usage Guidelines

Allowed

- ChatGPT
- Claude
- GitHub Copilot
- Cursor
- Local models
- Personal API keys

Not provided

Shared API keys

If APIs are unavailable

Use

- mocks
- fake data
- simulated workflows

Never block progress waiting for integrations.

---

# Development Workflow

Follow this order.

1. Define Problem

2. Create PRD

3. Define MVP

4. Split Tasks

5. Build

6. Test

7. Record Demo

---

# MVP Definition

Every feature must answer

Does this directly help demonstrate the core problem?

If NO

Remove it.

---

# Feature Checklist

Every feature should satisfy

✓ solves user pain

✓ demoable

✓ stable

✓ understandable in under 30 seconds

✓ contributes to judging

Otherwise remove it.

---

# Architecture Guidelines

Prefer

Frontend

↓

Backend API

↓

AI Service

↓

Database

Avoid unnecessary microservices.

Avoid unnecessary cloud infrastructure.

Avoid unnecessary DevOps.

Keep deployment simple.

---

# UI Guidelines

Prioritize

- clarity
- simplicity
- usability

Avoid

animations

complex dashboards

feature overload

---

# Coding Standards

Produce

- modular code
- reusable components
- meaningful naming
- comments only when necessary
- clean folder structure
- readable architecture

---

# Documentation

Maintain

README

Architecture

Setup

Known Limitations

Future Improvements

throughout development.

Do not leave documentation until the end.

---

# Demo First Development

Every feature should improve the demo.

Ask

Can this be demonstrated clearly?

If not

Do not build it.

---

# Time Management

Suggested timeline

Problem Definition

↓

PRD

↓

Architecture

↓

MVP

↓

Core Features

↓

Testing

↓

Video

↓

Submission

Never spend too long polishing UI.

---

# Recording Checklist

The final video should cover

Problem

Current Pain

Solution

Demo

AI Usage

Architecture

Business Value

Future Improvements

Within 3–5 minutes.

---

# Submission Checklist

Before submission verify

[ ] Application runs

[ ] No critical bugs

[ ] README complete

[ ] Video recorded

[ ] Repository clean

[ ] Zip created

[ ] Demo data included

[ ] Mock data works

[ ] No secrets committed

[ ] Environment variables documented

---

# AI Prompt Rules

Whenever an AI assistant generates anything, it must

- prioritize simplicity
- stay within MVP scope
- avoid unnecessary complexity
- produce production-quality code
- explain architectural decisions
- identify risks
- mention assumptions
- recommend simpler alternatives when appropriate

If a request appears outside the hackathon scope,

challenge it and suggest a smaller MVP.

---

# Preferred Technologies

Use technologies the team already knows.

Avoid learning new frameworks during the hackathon.

Choose stability over novelty.

---

# Constraints

Do not

- overengineer
- introduce unnecessary dependencies
- depend on unavailable APIs
- require enterprise infrastructure
- require paid services
- build features that cannot be demonstrated

---

# Success Definition

Success means

A complete, polished, reliable MVP solving one real problem with measurable business value.

NOT

The biggest application.

---

# Inspiration Areas

Potential domains

- Internal productivity
- Engineering workflow
- Code review
- Documentation
- Knowledge management
- Ticket triage
- AI assistant
- DevOps productivity
- Meeting intelligence
- Customer support
- QA automation
- Resource planning
- Compliance
- Security reviews

---

# Prompt Prefix

Before answering any request, assume the following:

"I am building a Version 1 AI Talent Hunt Hackathon project. My goal is to deliver a reliable MVP within 24 hours that maximizes judging criteria. Always optimize for simplicity, demo quality, measurable business value, and practical AI usage. Avoid overengineering. Suggest mocks when integrations are unavailable."

---

# Decision Rule

When there are multiple implementation options,

always recommend the option that

- is simplest
- can be completed fastest
- is easiest to demo
- has the lowest risk
- provides the highest judging impact.