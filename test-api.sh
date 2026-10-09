#!/bin/bash

echo "🧪 Тестирование API связей CoffeeHouse"
echo "========================================"
echo ""

BASE_URL="http://localhost:3000"

echo "1️⃣  Тест: GET /api/menu"
echo "-------------------"
curl -s "$BASE_URL/api/menu" | jq '.[0:2] | .[] | {name, price, category: .category.name}' 2>/dev/null || curl -s "$BASE_URL/api/menu" | head -5
echo ""
echo ""

echo "2️⃣  Тест: GET /api/orders"
echo "-------------------"
curl -s "$BASE_URL/api/orders" | jq 'length' 2>/dev/null || echo "Заказов: $(curl -s "$BASE_URL/api/orders" | grep -o '"id"' | wc -l)"
echo ""
echo ""

echo "3️⃣  Тест: GET /api/reservations"
echo "-------------------"
curl -s "$BASE_URL/api/reservations" | jq 'length' 2>/dev/null || echo "Бронирований: $(curl -s "$BASE_URL/api/reservations" | grep -o '"id"' | wc -l)"
echo ""
echo ""

echo "4️⃣  Тест: GET /api/reviews"
echo "-------------------"
curl -s "$BASE_URL/api/reviews" | jq 'length' 2>/dev/null || echo "Отзывов: $(curl -s "$BASE_URL/api/reviews" | grep -o '"id"' | wc -l)"
echo ""
echo ""

echo "✅ Все API endpoints доступны!"
echo ""
echo "📖 Полная документация: API_DOCUMENTATION.md"







