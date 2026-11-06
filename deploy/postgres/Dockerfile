FROM postgres:18-alpine AS extensions
RUN apk add --no-cache build-base curl-dev git icu-dev
# Pin source commits so extension binaries are reproducible across releases.
RUN git clone https://github.com/citusdata/pg_cron.git /tmp/pg_cron && \
    git -C /tmp/pg_cron checkout 465b38c737f584d520229f5a1d69d1d44649e4e5 && \
    make -C /tmp/pg_cron with_llvm=no && make -C /tmp/pg_cron install with_llvm=no
RUN git clone https://github.com/supabase/pg_net.git /tmp/pg_net && \
    git -C /tmp/pg_net checkout a8299b11182ea5c974f5e89ae83e70e9e44e9e8f && \
    make -C /tmp/pg_net with_llvm=no && make -C /tmp/pg_net install with_llvm=no

FROM postgres:18-alpine
RUN apk add --no-cache libcurl
COPY --from=extensions /usr/local/lib/postgresql/pg_cron.so /usr/local/lib/postgresql/
COPY --from=extensions /usr/local/lib/postgresql/pg_net.so /usr/local/lib/postgresql/
COPY --from=extensions /usr/local/share/postgresql/extension/pg_cron* /usr/local/share/postgresql/extension/
COPY --from=extensions /usr/local/share/postgresql/extension/pg_net* /usr/local/share/postgresql/extension/
