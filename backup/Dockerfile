FROM alpine:3.19

RUN apk add --no-cache \
    postgresql16-client \
    python3 \
    py3-pip \
    curl \
    tzdata && \
    pip3 install awscli --break-system-packages

ENV TZ=America/Sao_Paulo

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

CMD ["/usr/local/bin/backup.sh"]