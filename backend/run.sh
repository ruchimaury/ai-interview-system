#!/bin/bash
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "Starting FastAPI backend on http://localhost:8000"
python main.py
