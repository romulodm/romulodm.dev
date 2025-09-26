run: main.go
	go run main.go

tidy:
	go mod tidy
	go mod vendor

rundb:
	docker run --name portfolio -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=secret -d postgres:12-alpine

createdb:
	docker exec -it portfolio createdb --username=root --owner=root portfolio

execdb:
	docker exec -it portfolio psql -U root

dropdb:
	docker exec -it portfolio dropdb portfolio

logsdb:
	docker logs postgres12