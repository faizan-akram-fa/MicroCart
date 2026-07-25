# ☸️ Kubernetes (K8s) Orchestration Guide

This document explains how to deploy the **MicroCart** microservices stack onto any Kubernetes cluster using the production-ready manifests located in the `k8s/` folder.

---

## 📁 Manifest Directory Overview

```
k8s/
├── 00-namespace.yaml          # Defines 'microcart' isolated namespace
├── 01-configmaps-secrets.yaml # Environmental variables, JWT secrets & DB credentials
├── 02-databases.yaml         # PersistentVolumeClaims, Deployments & Services for 6 DBs
├── 03-microservices.yaml      # Deployments & Services for 7 NestJS microservices (GHCR images)
├── 04-frontend.yaml           # Deployment & Service for Next.js frontend
├── 05-ingress.yaml            # NGINX Ingress rules for custom domain routing & SSL
└── 06-hpa.yaml                # Horizontal Pod Autoscalers (HPA) for high-traffic scaling
```

---

## 🚀 Quick Deployment Guide

### Option A: Local Testing with Minikube / Kind

1. **Start Local Kubernetes Cluster**:
   ```bash
   minikube start --cpus=4 --memory=8192
   minikube addons enable ingress
   minikube addons enable metrics-server
   ```

2. **Apply All Manifests**:
   ```bash
   kubectl apply -f k8s/
   ```

3. **Monitor Deployment Progress**:
   ```bash
   kubectl get pods -n microcart -w
   ```

4. **Access Applications Locally**:
   ```bash
   minikube service frontend -n microcart
   ```

---

### Option B: Cloud Kubernetes Deployment (DigitalOcean DOKS / AWS EKS / GCP GKE)

1. **Connect `kubectl` to Cloud Cluster**:
   ```bash
   doctl kubernetes cluster kubeconfig save <cluster-name>  # DigitalOcean
   # OR
   aws eks update-kubeconfig --name <cluster-name>         # AWS EKS
   ```

2. **Deploy MicroCart Stack**:
   ```bash
   kubectl apply -f k8s/
   ```

3. **Verify Ingress External IP**:
   ```bash
   kubectl get ingress -n microcart
   ```
   Point your domain's DNS `A Record` (`microcart.com`) to the returned **EXTERNAL-IP** address.

---

## 🔍 Useful Troubleshooting Commands

- **Check Pod Statuses**:
  ```bash
  kubectl get pods -n microcart
  ```
- **View Container Logs**:
  ```bash
  kubectl logs -f deployment/api-gateway -n microcart
  ```
- **Check Auto-Scaler (HPA) Status**:
  ```bash
  kubectl get hpa -n microcart
  ```
- **Teardown Everything**:
  ```bash
  kubectl delete -f k8s/
  ```
