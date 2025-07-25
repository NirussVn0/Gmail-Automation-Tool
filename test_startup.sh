#!/bin/bash

echo "Testing startup script functionality..."

echo "1. Testing help function:"
bash run_server.sh --help

echo -e "\n2. Testing health check:"
if [[ -f "health_check.sh" ]]; then
    bash health_check.sh deps
else
    echo "health_check.sh not found, skipping..."
fi

echo -e "\n3. Testing manage services help:"
bash manage_services.sh help

echo -e "\nAll tests completed!"
