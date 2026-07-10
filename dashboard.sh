#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiZHIuYWZpYm9yYUBnbWFpbC5jb20iLCJyb2xlIjoiZG9jdG9yIiwiZGlzdHJpY3QiOiJHYXNhYm8iLCJpYXQiOjE3ODM1OTAyMTksImV4cCI6MTc4NDE5NTAxOX0.yMu5Nj7lu7bUK4Uzpf4DZg0SP0IKT870T_Q2CtzVrZQ"

echo "╔══════════════════════════════════════╗"
echo "║     I-HealthConnect Dashboard         ║"
echo "╠══════════════════════════════════════╣"
echo "║                                      ║"
echo "║  📊 Total      : $(curl -s -X GET "http://localhost:3000/api/referrals" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | wc -l)         ║"
echo "║  🟡 Pending    : $(curl -s -X GET "http://localhost:3000/api/referrals?status=pending" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | wc -l)         ║"
echo "║  🟢 Completed  : $(curl -s -X GET "http://localhost:3000/api/referrals?status=completed" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | wc -l)         ║"
echo "║  🔴 Cancelled  : $(curl -s -X GET "http://localhost:3000/api/referrals?status=cancelled" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | wc -l)         ║"
echo "║                                      ║"
echo "║  📈 High Risk   : $(curl -s -X GET "http://localhost:3000/api/referrals" -H "Authorization: Bearer $TOKEN" | grep -o '"riskTier":"high"' | wc -l)            ║"
echo "║  📈 Elevated    : $(curl -s -X GET "http://localhost:3000/api/referrals" -H "Authorization: Bearer $TOKEN" | grep -o '"riskTier":"elevated"' | wc -l)            ║"
echo "║  📈 Low Risk    : $(curl -s -X GET "http://localhost:3000/api/referrals" -H "Authorization: Bearer $TOKEN" | grep -o '"riskTier":"low"' | wc -l)            ║"
echo "║                                      ║"
echo "╚══════════════════════════════════════╝"
