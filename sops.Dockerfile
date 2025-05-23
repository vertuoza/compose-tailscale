# Use Alpine Linux for a lightweight base image
FROM alpine:3.19

# Set environment variables
ENV SOPS_VERSION=3.10.1
ENV GCLOUD_SDK_VERSION=523.0.0

# Install dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    python3 \
    py3-pip \
    bash \
    gnupg \
    && rm -rf /var/cache/apk/*

# Install SOPS
RUN curl -L "https://github.com/mozilla/sops/releases/download/v${SOPS_VERSION}/sops-v${SOPS_VERSION}.linux.amd64" \
    -o /usr/local/bin/sops \
    && chmod +x /usr/local/bin/sops

# Install Google Cloud SDK (minimal components for KMS)
RUN curl -L "https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-${GCLOUD_SDK_VERSION}-linux-x86_64.tar.gz" \
    -o /tmp/google-cloud-sdk.tar.gz \
    && tar -xzf /tmp/google-cloud-sdk.tar.gz -C /opt \
    && /opt/google-cloud-sdk/install.sh --quiet --usage-reporting=false --path-update=true \
    && rm -rf /tmp/google-cloud-sdk.tar.gz \
    && rm -rf /opt/google-cloud-sdk/.install/.backup

# Add Google Cloud SDK to PATH
ENV PATH="/opt/google-cloud-sdk/bin:${PATH}"

# Create a non-root user for security
RUN addgroup -g 1000 sops && \
    adduser -D -s /bin/bash -u 1000 -G sops sops

# Copy and setup entrypoint script
COPY sops-entrypoint.sh /usr/local/bin/sops-entrypoint.sh
RUN chmod +x /usr/local/bin/sops-entrypoint.sh

# Create directories for configuration and data
RUN mkdir -p /home/sops/.config/gcloud \
    && mkdir -p /workspace \
    && chown -R sops:sops /home/sops /workspace /usr/local/bin/sops-entrypoint.sh

# Switch to non-root user
USER sops
WORKDIR /workspace

# Set entrypoint to our custom script
ENTRYPOINT ["/usr/local/bin/sops-entrypoint.sh"]

# Default command shows help
CMD []
