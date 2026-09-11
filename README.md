# Reem Travel

Reem Travel is a full-stack travel concierge application for showcasing premium hotels, receiving booking requests, collecting enquiries, and managing reservations through a protected admin area.

## Stack

- Frontend: React, React Router, Tailwind CSS, Axios
- Backend: FastAPI, MongoDB, JWT, TOTP-based two-factor authentication

## Project structure

```text
backend/     FastAPI service and API tests
frontend/    React application
```

## Local development

1. Copy `backend/.env.example` to `backend/.env` and set unique local values.
2. Copy `frontend/.env.example` to `frontend/.env` and set the API address.
3. Start the API:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements-dev.txt
   uvicorn server:app --reload --port 8080
   ```

4. Start the frontend in a second terminal:

   ```bash
   cd frontend
   yarn install --frozen-lockfile
   yarn start
   ```

## Testing

Backend integration tests are disabled unless explicitly enabled and configured for a disposable environment. Copy `backend/tests/.env.example`, load those values locally, then run:

```bash
cd backend
REEM_RUN_INTEGRATION_TESTS=1 pytest tests
```

Never point these tests at production: they create and modify test records.

## Security

- Do not commit `.env` files or credentials.
- Use unique secrets for every environment.
- Set `CORS_ORIGINS` to the exact frontend domains allowed to call the API.
- Rotate credentials immediately if they are ever committed or shared.
