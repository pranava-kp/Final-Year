import sys
import os

# Print the current working directory where the script is being run from
print("Current working directory:", os.getcwd())

# Print the list of directories that Python searches for modules
print("Python's module search path (sys.path):")
for p in sys.path:
    print(p)