import docker

# Path to the client certificates
# tls_config = docker.tls.TLSConfig(
#     client_cert=('/Users/ai/Documents/tls_docker/cert.pem', '/Users/ai/Documents/tls_docker/key.pem'),
#     ca_cert='/Users/ai/Documents/tls_docker/ca.pem',
#     verify=True,
# )

# # Initialize the Docker client
# client = docker.DockerClient(
#     base_url='tcp://app.docker.com:2377',  # Remote Docker host
#     tls=tls_config
# )

_client = None

def get_client():
    global _client
    if _client is None:
        print("Initializing Docker client...")
        _client = docker.from_env()
    return _client

# client = get_client()  # Replaced with get_client() for lazy loading

# --host=tcp://0.0.0.0:2376 --tlsverify --tlscacert /certs/server/ca.pem --tlscert /certs/server/cert.pem --tlskey /certs/server/key.pem