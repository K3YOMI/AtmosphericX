openssl genrsa -out cert/generated.key 2048
openssl req -new -key cert/generated.key -out cert/generated.csr
openssl x509 -req -days 365 -in cert/generated.csr -signkey cert/generated.key -out cert/generated.crt