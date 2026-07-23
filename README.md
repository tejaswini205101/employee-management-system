# Orbit — Employee Management System

A full-stack Employee Management System:

- **Frontend:** React (Vite) + React Router + Axios
- **Backend:** Python, FastAPI, JWT auth
- **Database:** MongoDB (via Motor async driver)
- **Containerization:** Docker + Docker Compose
- **CI/CD:** Jenkins pipeline (`Jenkinsfile`), triggered by a GitHub webhook; a
  lightweight GitHub Actions workflow runs as a fast PR gate

Features: admin/staff login (JWT), employee CRUD with search/filter by
department and status, department CRUD, daily attendance tracking, and a
dashboard with headcount and payroll summaries. The first account ever
registered automatically becomes `admin`; everyone after that registers as
`staff`.

**Two distinct portals, not just hidden buttons:**
- **Admin console** (`/`, `/employees`, `/departments`, `/attendance`) — dark
  sidebar, full CRUD access, attendance marking for the whole team. Guarded
  by `AdminRoute`; a staff account hitting these URLs directly is redirected
  to the employee portal instead.
- **Employee portal** (`/portal`, `/portal/directory`, `/portal/departments`,
  `/portal/attendance`) — a visually separate, warm/cream top-nav layout
  (see `frontend/src/layouts/EmployeeLayout.jsx`) with a personal home page,
  a salary-free team directory, read-only departments, and a "My attendance"
  view. Any logged-in account can reach it; admins land in the console by
  default, staff land in the portal by default (both are decided at
  login/register time based on role).

**Attendance:** admins mark daily present/absent/half-day/leave status for
any employee from the admin console's Attendance page. Anyone logged in can
see their own attendance history under "My attendance" in whichever portal
they use. A logged-in account is matched to an employee record **by email**,
so make sure the email someone registers with matches the email on their
employee record (added via Employees → Add employee) — otherwise they'll see
a "no employee record linked" message instead of their history.

---

## 1. Project structure

```
employee-management-system/
├── backend/                 # FastAPI app
│   ├── app/
│   │   ├── main.py           # app entrypoint
│   │   ├── config.py         # env-based settings
│   │   ├── database.py       # Mongo connection + indexes
│   │   ├── schemas.py        # Pydantic models
│   │   ├── auth_utils.py     # JWT + password hashing
│   │   └── routers/          # auth.py, employees.py, departments.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React (Vite) app
│   ├── src/
│   │   ├── pages/            # Login, Register, Dashboard, Employees, Departments
│   │   ├── components/       # Sidebar, ProtectedRoute, EmployeeFormModal
│   │   ├── context/AuthContext.jsx
│   │   └── api/client.js
│   ├── nginx.conf            # serves the SPA + proxies /api to the backend
│   └── Dockerfile
├── docker-compose.yml         # local/dev stack (builds images)
├── docker-compose.prod.yml    # deploy stack (pulls pre-built images)
├── Jenkinsfile                 # CI/CD pipeline
└── .github/workflows/ci.yml    # PR-gate checks on GitHub
```

---

## 2. Run it locally with Docker (fastest path)

```bash
git clone <your-repo-url>
cd employee-management-system
docker compose up --build
```

- Frontend: http://localhost
- Backend docs (Swagger UI): http://localhost:8000/docs
- MongoDB: localhost:27017 (root/rootpassword by default — override via env vars)

Open http://localhost, click **Create one**, and register. The first user
you create becomes the admin.

To stop: `docker compose down` (add `-v` to also wipe the Mongo volume).

### Environment variables (optional overrides)

Create a `.env` file next to `docker-compose.yml`:

```
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=change-me
JWT_SECRET_KEY=a-long-random-string
```

---

## 3. Run it without Docker (manual dev setup)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # edit MONGO_URI if your Mongo isn't local
uvicorn app.main:app --reload --port 8000
```
Make sure a MongoDB instance is running locally (`mongod`) or point
`MONGO_URI` in `.env` at Atlas / a remote instance.

**Frontend**
```bash
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```
Visit http://localhost:5173.

---

## 4. Connecting the repo to GitHub

```bash
cd employee-management-system
git init
git add .
git commit -m "Initial commit: Employee Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

That's it for the GitHub side — the repo now hosts the code, the
`.github/workflows/ci.yml` workflow will run automatically on every push/PR,
and Jenkins (below) will pick up commits via a webhook.

---

## 5. Wiring up Jenkins (CI/CD pipeline)

1. **Install Jenkins** with Docker available on the same host/agent (Jenkins
   needs to be able to run `docker build`/`docker push`), e.g.:
   ```bash
   docker run -d --name jenkins \
     -p 8080:8080 -p 50000:50000 \
     -v jenkins_home:/var/jenkins_home \
     -v /var/run/docker.sock:/var/run/docker.sock \
     jenkins/jenkins:lts
   ```
2. **Install plugins:** Git, Pipeline, Docker Pipeline, GitHub Integration,
   JUnit.
3. **Add credentials** (Manage Jenkins → Credentials → System → Global):
   - `dockerhub-creds` — Username/Password (or access token) for Docker Hub
     or your container registry. The `Jenkinsfile` expects this exact ID.
4. **Create the job:**
   - New Item → *Pipeline* (or *Multibranch Pipeline* if you want PR builds
     too) → point "Pipeline script from SCM" at your GitHub repo URL and set
     the script path to `Jenkinsfile`.
   - Set the `IMAGE_REGISTRY` build parameter to your Docker Hub
     username/namespace (defaults to `yourdockerhubuser` — change it).
5. **Connect GitHub → Jenkins with a webhook** so pushes trigger builds:
   - In your GitHub repo: Settings → Webhooks → Add webhook
   - Payload URL: `http://<your-jenkins-host>:8080/github-webhook/`
   - Content type: `application/json`
   - Event: "Just the push event" (or "Pull requests" too if desired)
   - In the Jenkins job config, enable "GitHub hook trigger for GITScm
     polling".
6. Push a commit — Jenkins will: install & test the backend, build the
   frontend, build both Docker images, push them to your registry, then (on
   `main`) redeploy via `docker-compose.prod.yml`.

> Jenkins and GitHub are external services that need to run in your own
> infrastructure — this repo gives you every config file needed
> (`Jenkinsfile`, webhook URL, credential IDs) to wire them up as described
> above.

---

## 6. API reference (quick overview)

All endpoints are prefixed with `/api`. Interactive docs live at `/docs`
(Swagger) once the backend is running.

| Method | Endpoint                  | Auth        | Description                     |
|--------|----------------------------|-------------|----------------------------------|
| POST   | `/api/auth/register`       | —           | Create account (first = admin)  |
| POST   | `/api/auth/login`          | —           | Get JWT access token             |
| GET    | `/api/auth/me`             | Bearer      | Current user profile             |
| GET    | `/api/employees/`          | Bearer      | List/search/filter employees     |
| POST   | `/api/employees/`          | Admin       | Create employee                  |
| GET    | `/api/employees/{id}`      | Bearer      | Get one employee                 |
| PUT    | `/api/employees/{id}`      | Admin       | Update employee                  |
| DELETE | `/api/employees/{id}`      | Admin       | Delete employee                  |
| GET    | `/api/departments/`        | Bearer      | List departments                 |
| POST   | `/api/departments/`        | Admin       | Create department                |
| PUT    | `/api/departments/{id}`    | Admin       | Update department                 |
| DELETE | `/api/departments/{id}`    | Admin       | Delete department (if empty)     |
| GET    | `/api/attendance/me`       | Bearer      | Your own attendance history       |
| GET    | `/api/attendance/`         | Admin       | All attendance (filter by employee/date) |
| POST   | `/api/attendance/mark`     | Admin       | Mark/update attendance for one employee+date |
| DELETE | `/api/attendance/{id}`     | Admin       | Delete an attendance record       |

---

## 7. Notes & next steps

- JWT secret and Mongo credentials default to placeholder values — always
  override them via environment variables before deploying anywhere real.
- The `staff` role can currently only view data; adjust `require_admin`
  usages in `backend/app/routers/` if you want different permissions.
- For a managed database instead of the `mongodb` container, just point
  `MONGO_URI` at your MongoDB Atlas connection string in the environment
  passed to the `backend` service.
