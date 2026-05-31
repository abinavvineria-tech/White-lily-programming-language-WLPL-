from setuptools import setup, find_packages

setup(
    name="whitescript",
    version="1.0.0",
    description="White Lily Script — a magical, nature-inspired programming language",
    packages=find_packages(include=["whitescript", "whitescript.*"]),
    python_requires=">=3.10",
)
