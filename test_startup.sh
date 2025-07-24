#!/bin/bash

echo "Testing startup script functionality..."

echo "1. Testing help function:"
bash start_server.sh --help

echo -e "\n2. Testing health check:"
bash health_check.sh deps

echo -e "\n3. Testing manage services help:"
bash manage_services.sh help

echo -e "\nAll tests completed!"
