# Collab - Backend (Slim Version)

## Overview

Welcome to the backend repository for the Collab app. This repository contains all the APIs, thoroughly tested to cover various scenarios.

## Project Objective

The primary aim of this application is to facilitate connections among individuals for project collaborations. What sets this web app apart is its unique feature enabling developers to choose the projects they want to work on, distinguishing it from traditional job listing platforms.

## Technology Stack

- Node.js
- Express
- PostgreSQL
- Objection.js

## Models

The backend consists of various models:
- User
- Project
- Authentication
- Skill
- Tag
- Marked Candidate
- Notification
- Event
- Project Application

## User Scenarios

### John's Experience
John, a web developer in a company, needs to find candidates for a new full-stack developer role. He explores Collab, registers, and shares his location and social media details.

Creating a project—an e-commerce website—he specifies project details, required skills (like node.js, react.js), and tags (such as 'ecommerce'). Marking it as a paying project, he publishes it. This project is now visible on the project feed and searchable.

### David's Journey
David, unemployed but skilled in node.js and learning React, joins Collab to find potential projects. He optimizes his profile resembling a CV, adds his portfolio link, and searches for paying projects matching his skills.

He applies for John's e-commerce project, sharing insights about his experience and contact email. John, receiving the request, reviews David's profile, Github, portfolio, and decides whether to contact him.

### Project Interaction
John, after two days with no new requests, explores users matching project skills. He finds Jessica, expresses interest via Collab's feature. Jessica receives a notification about John's interest in her skills for the "J-Fashion" project. She then decides whether to apply, maintaining control over her contact information.

This approach ensures privacy until a user decides to apply for a project, empowering users to manage their interactions.

