# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.11.0
# non slim version so that python3 comes installed
FROM node:${NODE_VERSION} AS base
LABEL fly_launch_runtime="Node.js"
# Node.js app lives here
WORKDIR /app
# Set production environment
ENV NODE_ENV="production"
# # Throw-away build stage to reduce size of final image
# FROM base AS build
# Install packages needed to build node modules and python3
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*
# Create and activate virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
# Ensure Python scripts use the virtual environment
ENV PYTHONPATH="$VIRTUAL_ENV/lib/python3.11/site-packages:$PYTHONPATH"
# Install Python dependencies in the virtual environment
RUN pip3 install --no-cache-dir \
    sortedcontainers \
    cython
# Install node modules
COPY package-lock.json package.json ./
RUN npm ci
# Copy application code
COPY . .
# # Final stage for app image
# FROM base
# # Copy built application
# COPY --from=build /app /app
# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "index.js" ]