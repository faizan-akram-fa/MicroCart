# 🐳 How to Run MicroCart with Docker

This guide explains how to run the entire **MicroCart** e-commerce application (all microservices + databases + frontend) using Docker.

## ✅ Prerequisites

1.  **Docker Desktop** installed and running on your machine.
2.  **Git** (optional, to clone/pull the repo).

## 🚀 Quick Start

1.  **Open a terminal** (PowerShell or Command Prompt) in the root directory of the project (`d:\University\ecommerce-microservices`).

2.  **Build and Start All Services**:
    Run the following command to build the Docker images and start the containers:
    ```bash
    docker-compose up --build -d
    ```
    - `--build`: Rebuilds images if you made changes.
    - `-d`: Runs containers in "detached" mode (in the background).

3.  **Wait for Services**:
    It may take a few minutes for everything to start, especially the first time (downloading images, installing dependencies).

4.  **Access the Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **API Gateway**: [http://localhost:4000](http://localhost:4000)
    - **pgAdmin (Database GUI)**: You can use your local pgAdmin 4 to connect to these databases.
      - **Guide**: [Connecting pgAdmin 4 to Docker](./DOCKER_PGADMIN_SETUP.md)
      - **Ports**:
        - User DB: `5433`
        - Product DB: `5434`
        - Cart DB: `5435`
        - Order DB: `5436`
        - Wishlist DB: `5437`
      - **Credentials**: Username: `postgres`, Password: `postgres`

## 🛠️ Common Commands

### Stop All Services
```bash
docker-compose down
```

### View Logs
To see logs for all services:
```bash
docker-compose logs -f
```
To see logs for a specific service (e.g., user-service):
```bash
docker-compose logs -f user-service
```

### Restart a Specific Service
If you made changes to `user-service` code:
```bash
docker-compose restart user-service
```

## 🐛 Troubleshooting

-   **Port Conflicts**: If you see "Bind for 0.0.0.0:xxxx failed: port is already allocated", make sure you stop any local instances running on those ports (e.g., if you ran `npm run start` locally).
-   **Database Connection Errors**: Ensure the database containers are healthy (`docker ps`). The services are configured to talk to the DB containers using their service names (e.g., `user-db`) which Docker resolves automatically.

## 📂 Docker File Structure

-   `docker-compose.yml`: Defines all services, networks, and volumes.
-   `services/*/Dockerfile`: Instructions to build each microservice.
-   `frontend/Dockerfile`: Instructions to build the Next.js frontend.
-   `volumes/`: Persistent data for databases (created automatically).
