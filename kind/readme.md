

# Setting Up kubernetes cluster master/worker
## Set hostname
```bash
hostnamectl set-hostname k8s-master/k8s-worker
```

## Disable Swap (Required for Kubernetes)
```bash
swapoff -a
sed -i '/\/swap.img/ s/^[^#]/#&/' /etc/fstab
```

## Load Kernel Modules
```bash
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter
```

## Configure Sysctl for Networking
```bash
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sysctl --system
```

## Install Container Runtime (containerd)
```bash
apt-get update
apt-get install -y containerd
```

## Configure containerd to use SystemdCgroup
```bash
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml >/dev/null
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml

systemctl restart containerd
```

# Add Kubernetes Repository
## Install dependencies
```bash
apt-get update && apt-get install -y apt-transport-https ca-certificates curl gpg
```
## Download the GPG Key
```bash
mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
```
## Add the Repository (Corrected spelling)
```bash
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list
```

## Install Kubernetes Tools & Dependencies
```bash
apt-get update
apt-get install -y kubelet kubeadm kubectl conntrack socat
apt-mark hold kubelet kubeadm kubectl
```

## Initialize the Cluster

```bash
kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=<MASTER-IP>
```
## Join the cluster
```bash
kubeadm join <NEW_MASTER_IP>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```
<br/>

## Post-Initialization (on master)
## User Config
```bash
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

## Install Networking (Flannel)
```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

## Install local-path-provisioner
```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```
<br/>

## if you fcuked up any step

```bash
# 1. Clear the failed state
kubeadm reset -f

# 2. Cleanup networking and folders
rm -rf /etc/cni/net.d
rm -rf $HOME/.kube/config

# 3. Double-check swap is still off (it must be 0)
free -m
```

Note: use this when you dont have the token with you "kubeadm token create --print-join-command" or "kubeadm token list"

<br />

# Setting up docker for remote access

## Generate Certificates
### Generate CA private key and certificate:
```bash
openssl genrsa -aes256 -out ca-key.pem 4096
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem

```
### Create Server Key and Certificate
```bash
echo "subjectAltName = IP:<REMOTE_IP>,IP:127.0.0.1" > extfile.cnf
echo "extendedKeyUsage = serverAuth" >> extfile.cnf

openssl genrsa -out server-key.pem 4096
openssl req -subj "/CN=<REMOTE_IP>" -sha256 -new -key server-key.pem -out server.csr
openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem -extfile extfile.cnf
```
### Create Client Key and Certificate
```bash
openssl genrsa -out key.pem 4096
openssl req -subj '/CN=client' -new -key key.pem -out client.csr
echo "extendedKeyUsage = clientAuth" > client-extfile.cnf
openssl x509 -req -days 365 -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
  -CAcreateserial -out cert.pem -extfile client-extfile.cnf

```
## Configure Docker Daemon
### Move server files to a secure location:
```bash
sudo mkdir -p /etc/docker/ssl
sudo cp ca.pem server-cert.pem server-key.pem /etc/docker/ssl/
```
### Edit the Docker service override
```bash
sudo systemctl edit docker.service
```
### Paste the following (ensure the empty ExecStart= is included)
```conf
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2376 --tlsverify --tlscacert=/etc/docker/ssl/ca.pem --tlscert=/etc/docker/ssl/server-cert.pem --tlskey=/etc/docker/ssl/server-key.pem

```
### Reload and restart
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

Note: Copy ca.pem, cert.pem, and key.pem from the remote server to your local











