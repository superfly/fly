default : test
.PHONY : test new-certificates

test :
	npm test


# Generate new SSL certificates
new-certificates : test/ssl/certificate.pem test/ssl/privatekey.pem
	rm -f request.pem

test/ssl/privatekey.pem :
	# Generate a Private Key
	openssl genrsa -out server.key 1024
	openssl rsa -in server.key -out test/ssl/privatekey.pem
	rm -f server.key

request.pem : test/ssl/privatekey.pem
	openssl req -new -key test/ssl/privatekey.pem -out request.pem

test/ssl/certificate.pem : request.pem test/ssl/privatekey.pem
	# Generating a Self-Signed Certificate
	openssl req -x509 -days 365 -key test/ssl/privatekey.pem -in request.pem -out test/ssl/certificate.pem
