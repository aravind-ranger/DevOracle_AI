import os
import sys

# Get absolute path to the backend folder
backend_dir = os.path.dirname(os.path.abspath(__file__))

# Programmatically inject local libs and app root into Python path
#sys.path.insert(0, os.path.join(backend_dir, "libs"))
sys.path.insert(0, backend_dir)

import uvicorn

if __name__ == "__main__":
    print("Starting DevOracle AI backend server...")
    print(f"Working Directory: {backend_dir}")
    print("Python Search Path (sys.path):")
    for path in sys.path[:3]:
        print(f" - {path}")
    
    # Launch Uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False
    )
