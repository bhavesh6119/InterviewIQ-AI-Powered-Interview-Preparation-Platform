# Frontend Architecture Layers

This project follows a simple layered frontend architecture so that the code stays clean, organized, and easier to scale as the app grows.

## 1. UI Layer
Purpose: This layer is responsible for what the user sees on screen.

Folders:
- components
- pages

Examples:
- Buttons, cards, forms, navbar, modals, etc.
- Login page, Register page, Dashboard page, etc.

In simple terms:
- This is where the design and visual structure live.
- The user interacts with this layer.

---

## 2. Hooks Layer
Purpose: This layer contains reusable logic that is used across components.

Folder:
- hooks

Examples:
- custom hooks for local storage
- reusable form logic
- auth-related utility hooks
- API-triggering logic

In simple terms:
- If a piece of logic is used by multiple components, we keep it in hooks.
- This helps avoid repeating the same code again and again.

---

## 3. State Layer
Purpose: This layer manages shared application data and global state.

Files:
- auth.context.jsx
- ai.context.jsx

Examples:
- logged-in user data
- auth token state
- AI-related chat/session state
- global app data that multiple pages need

In simple terms:
- If many components need the same information, we store it in a shared state.
- This helps all parts of the app stay in sync.

For example:
- after login, the app must know that the user is authenticated
- this data is often stored in context so every page can access it

---

## 4. API Layer
Purpose: This layer handles communication between the frontend and backend.

Folder:
- services

File:
- auth.api.js

Examples:
- login request
- register request
- logout request
- fetch user profile data

In simple terms:
- UI layer asks for data
- API layer sends requests to the backend
- backend returns response
- state updates based on that response

This keeps the UI code cleaner and separates HTTP logic from UI logic.

---

## Why this structure is useful
This layered architecture helps in:
- easier debugging
- better code organization
- cleaner teamwork
- easier scaling when the app grows
- less confusion between UI, logic, state, and API code

---

## Hinglish explanation

Yeh 4 layers frontend ko clean aur maintainable banane ke liye design kiye gaye hain.

1. UI Layer = user ko jo dikhta hai, wo yahi part manage karta hai.
   Example: buttons, forms, pages.

2. Hooks Layer = repeated logic yahi rakhte hain.
   Example: custom logic jo multiple components use karte hain.

3. State Layer = app ka shared data yahi handle karta hai.
   Example: login user ka data, AI session data.

4. API Layer = frontend aur backend ke beech communication.
   Example: login/register API calls.

Iska idea yeh hai ki har layer ek specific kaam kare:
- UI dikhane ka kaam
- Hooks logic ka kaam
- State data ka kaam
- API backend se connect karne ka kaam

Aise structure banaane se code samajhna aur future me extend karna easy ho jata hai.

---

## Quick roadmap for this project
As the project grows, this architecture can be extended with:
- pages/
- components/
- hooks/
- contexts/
- services/
- utils/
- constants/
- routes/

This is a common pattern used in React apps and makes project growth much easier.
