.PHONY: help go-install go-run python-install python-run docker-up docker-down docker-build

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

go-install: ## Install Go dependencies
	cd go && go mod download

go-run: ## Run Go backend
	cd go && go run main.go

python-install: ## Install Python dependencies
	cd python && pip install -r requirements.txt

python-run: ## Run Python backend
	cd python && python main.py

docker-up: ## Start both services with Docker Compose
	docker-compose up

docker-down: ## Stop Docker Compose services
	docker-compose down

docker-build: ## Build Docker images for both services
	docker-compose build

