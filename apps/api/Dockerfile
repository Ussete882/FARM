# BASTET — servidor.
#
# Construído a partir da raiz do repositório, não desta pasta: a API importa
# @bastet/nucleo, que é um workspace irmão. Um contexto limitado a apps/api não
# o alcançaria.
#
#   docker build -f apps/api/Dockerfile -t bastet-api .

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/nucleo/package.json packages/nucleo/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# Só o que o servidor precisa. O cliente é estático e vai para outro lado.
RUN npm ci --omit=dev --workspace @bastet/api --include-workspace-root

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV BASTET_AMBIENTE=producao

COPY --from=dependencias /app/node_modules ./node_modules
COPY package.json ./
COPY packages/nucleo ./packages/nucleo
COPY apps/api ./apps/api
COPY infra/migracoes ./infra/migracoes

# Corre como utilizador sem privilégios. Um processo que não precisa de ser
# root não deve poder sê-lo.
USER node

EXPOSE 4000
CMD ["npx", "tsx", "apps/api/src/servidor.ts"]
