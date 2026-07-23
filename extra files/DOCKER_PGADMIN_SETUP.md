# 🐘 Connecting pgAdmin 4 to Docker Databases

This guide explains how to connect your **local pgAdmin 4** (installed on your Windows machine) to the PostgreSQL databases running inside **Docker containers**.

---

## 📋 Connection Summary

When databases run in Docker, they are "mapped" to specific ports on your `localhost`. Use these details to add each server in pgAdmin.

| Database Service | Host | Port | Database Name | Username | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User DB** | `localhost` | **5433** | `user_db` | `postgres` | `postgres` |
| **Product DB** | `localhost` | **5434** | `product_db` | `postgres` | `postgres` |
| **Cart DB** | `localhost` | **5435** | `cart_db` | `postgres` | `postgres` |
| **Order DB** | `localhost` | **5436** | `order_db` | `postgres` | `postgres` |
| **Wishlist DB** | `localhost` | **5437** | `wishlist_db` | `postgres` | `postgres` |

---

## 🚀 Step-by-Step Connection

1.  **Start your Docker containers**:
    ```bash
    docker-compose up -d
    ```

2.  **Open pgAdmin 4** on your computer.

3.  **Add a New Server**:
    - Right-click **Servers** > **Register** > **Server...**
    - **General Tab**: Give it a name (e.g., `MicroCart - User DB`).
    - **Connection Tab**:
        - **Host name/address**: `localhost`
        - **Port**: `5433` (as per table above)
        - **Maintenance database**: `user_db`
        - **Username**: `postgres`
        - **Password**: `postgres`
    - Click **Save**.

4.  **Repeat** for all 5 databases using the ports listed in the table above.

---

## ❓ Why use `localhost` and not the Service Name?

- **Inside Docker**: Services talk to each other using names like `user-db`.
- **Outside Docker (Your PC)**: You must use `localhost` because Docker "forwards" the database ports to your local machine.

## 🔧 Troubleshooting

- **Connection Timeout**: Ensure Docker Desktop is running and the containers are "Up". Check with `docker ps`.
- **Port Conflict**: If you have a local PostgreSQL installed on port `5432`, don't worry! These Docker databases use ports **5433 to 5437** to avoid conflicts.
