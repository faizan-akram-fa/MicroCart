#!/bin/bash
# =========================================================================
# Live Kubernetes Database Restore Script for MicroCart
# =========================================================================

echo "=========================================="
echo " Importing Local Databases to Kubernetes "
echo "=========================================="

NAMESPACE="microcart"

# 1. USER DB
USER_POD=$(kubectl get pod -n $NAMESPACE -l app=user-db -o jsonpath='{.items[0].metadata.name}')
if [ -f ~/MicroCart/db-dumps/user_db.sql ]; then
  echo "Restoring user_db into pod $USER_POD..."
  kubectl exec -i $USER_POD -n $NAMESPACE -- psql -U postgres -d user_db < ~/MicroCart/db-dumps/user_db.sql
fi

# 2. PRODUCT DB
PRODUCT_POD=$(kubectl get pod -n $NAMESPACE -l app=product-db -o jsonpath='{.items[0].metadata.name}')
if [ -f ~/MicroCart/db-dumps/product_db.sql ]; then
  echo "Restoring product_db into pod $PRODUCT_POD..."
  kubectl exec -i $PRODUCT_POD -n $NAMESPACE -- psql -U postgres -d product_db < ~/MicroCart/db-dumps/product_db.sql
fi

# 3. CART DB
CART_POD=$(kubectl get pod -n $NAMESPACE -l app=cart-db -o jsonpath='{.items[0].metadata.name}')
if [ -f ~/MicroCart/db-dumps/cart_db.sql ]; then
  echo "Restoring cart_db into pod $CART_POD..."
  kubectl exec -i $CART_POD -n $NAMESPACE -- psql -U postgres -d cart_db < ~/MicroCart/db-dumps/cart_db.sql
fi

# 4. ORDER DB
ORDER_POD=$(kubectl get pod -n $NAMESPACE -l app=order-db -o jsonpath='{.items[0].metadata.name}')
if [ -f ~/MicroCart/db-dumps/order_db.sql ]; then
  echo "Restoring order_db into pod $ORDER_POD..."
  kubectl exec -i $ORDER_POD -n $NAMESPACE -- psql -U postgres -d order_db < ~/MicroCart/db-dumps/order_db.sql
fi

# 5. WISHLIST DB
WISHLIST_POD=$(kubectl get pod -n $NAMESPACE -l app=wishlist-db -o jsonpath='{.items[0].metadata.name}')
if [ -f ~/MicroCart/db-dumps/wishlist_db.sql ]; then
  echo "Restoring wishlist_db into pod $WISHLIST_POD..."
  kubectl exec -i $WISHLIST_POD -n $NAMESPACE -- psql -U postgres -d wishlist_db < ~/MicroCart/db-dumps/wishlist_db.sql
fi

# 6. SUPPORT DB
SUPPORT_POD=$(kubectl get pod -n $NAMESPACE -l app=support-db -o jsonpath='{.items[0].metadata.name}')
if [ -f ~/MicroCart/db-dumps/support_db.sql ]; then
  echo "Restoring support_db into pod $SUPPORT_POD..."
  kubectl exec -i $SUPPORT_POD -n $NAMESPACE -- psql -U postgres -d support_db < ~/MicroCart/db-dumps/support_db.sql
fi

echo "=========================================="
echo "✅ All database records restored successfully!"
echo "=========================================="

kubectl rollout restart deployment -n $NAMESPACE
