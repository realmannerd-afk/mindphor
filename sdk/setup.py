from setuptools import setup, find_packages

setup(
    name="mindphor",
    version="0.1.0",
    description="AI reliability monitoring for production apps",
    author="Mindphor",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0"
    ],
    python_requires=">=3.8",
)
