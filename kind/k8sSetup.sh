#!/usr/bin/env bash

set -e

# ---------- Helpers ----------
log() {
  echo -e "\n\033[1;34m[INFO]\033[0m $1"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1\n"
}

warn() {
  echo -e "\033[1;33m[WARN]\033[0m $1\n"
}

error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1\n"
}

confirm() {
  read -p "$1 (y/n): " choice
  [[ "$choice" == "y" || "$choice" == "Y" ]]
}

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "Run as root or use sudo"
    exit 1
  fi
}

pause() {
  read -p "Press Enter to continue..."
}

# ---------- Repo Fix ----------
fix_broken_k8s_repo() {
  local file="/etc/apt/sources.list.d/kubernetes.list"

  if [[ -f "$file" ]] && grep -q '\\' "$file"; then
    warn "Broken Kubernetes repo detected. Fixing..."
    rm -f "$file"
    success "Broken repo removed"
  fi
}

# ---------- Core Setup ----------

set_hostname() {
  read -p "Enter hostname (k8s-master / k8s-worker): " hostname
  hostnamectl set-hostname "$hostname"
  success "Hostname set to $hostname"
}

disable_swap() {
  log "Disabling swap..."
  swapoff -a
  sed -i '/\/swap.img/ s/^[^#]/#&/' /etc/fstab || true
  success "Swap disabled"
}

load_kernel_modules() {
  log "Loading kernel modules..."
  cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

  modprobe overlay
  modprobe br_netfilter
  success "Kernel modules loaded"
}

configure_sysctl() {
  log "Configuring sysctl..."
  cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

  sysctl --system
  success "Sysctl configured"
}

# ---------- Kubernetes Repo ----------

add_k8s_repo() {
  log "Adding Kubernetes repo..."

  fix_broken_k8s_repo
  apt-get update && apt-get install -y apt-transport-https ca-certificates curl gpg
  mkdir -p -m 755 /etc/apt/keyrings

  echo "Select Kubernetes version:"
  echo "1) v1.31"
  echo "2) v1.30"
  echo "3) v1.29"
  echo "4) Custom"

  read -p "Choice: " vchoice

  case $vchoice in
    1) K8S_VERSION="v1.31" ;;
    2) K8S_VERSION="v1.30" ;;
    3) K8S_VERSION="v1.29" ;;
    4) read -p "Enter version (e.g. v1.28): " K8S_VERSION ;;
    *) error "Invalid choice"; return 1 ;;
  esac

  success "Using version: $K8S_VERSION"

  local repo_file="/etc/apt/sources.list.d/kubernetes.list"
  local backup="/tmp/k8s_repo_backup.list"

  [[ -f "$repo_file" ]] && cp "$repo_file" "$backup"

  curl -fsSL "https://pkgs.k8s.io/core:/stable:/${K8S_VERSION}/deb/Release.key" \
    | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

  echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/${K8S_VERSION}/deb/ /" \
    | tee "$repo_file" > /dev/null

  if apt-get update; then
    success "Repo added successfully"
  else
    warn "Repo failed. Rolling back..."
    [[ -f "$backup" ]] && mv "$backup" "$repo_file" || rm -f "$repo_file"
    return 1
  fi
}

# ---------- Installations ----------

install_containerd() {
  log "Installing containerd..."
  fix_broken_k8s_repo
  apt-get update
  apt-get install -y containerd
  success "containerd installed"
}

configure_containerd() {
  log "Configuring containerd..."
  mkdir -p /etc/containerd
  containerd config default | tee /etc/containerd/config.toml >/dev/null
  sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
  systemctl restart containerd
  success "containerd configured"
}

install_k8s_tools() {
  log "Installing Kubernetes tools..."
  fix_broken_k8s_repo
  apt-get update
  apt-get install -y kubelet kubeadm kubectl conntrack socat
  apt-mark hold kubelet kubeadm kubectl
  success "Kubernetes tools installed"
}

# ---------- Cluster Ops ----------

init_cluster() {
  read -p "Enter MASTER IP: " ip

  kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address="$ip"

  log "Setting up kubeconfig..."
  mkdir -p $HOME/.kube
  cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  chown $(id -u):$(id -g) $HOME/.kube/config

  success "Cluster initialized"

  echo ""
  log "Join command:"
  kubeadm token create --print-join-command
}

join_cluster() {
  read -p "Paste join command: " cmd
  eval "$cmd"
  success "Worker joined cluster"
}

post_master_setup() {
  echo ""
  echo "This will:"
  echo "- Install Flannel (networking)"
  echo "- Install local-path-provisioner (storage)"
  echo ""

  if confirm "Continue?"; then
    kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
    kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
    success "Post setup completed"
  else
    warn "Skipped post setup"
  fi
}

reset_cluster() {
  warn "This will RESET this node!"

  if confirm "Proceed?"; then
    log "Resetting kubeadm..."
    kubeadm reset -f || true

    log "Cleaning CNI configs..."
    rm -rf /etc/cni/net.d

    log "Cleaning kubeconfig (if exists)..."
    rm -rf $HOME/.kube/config 2>/dev/null || true

    log "Cleaning iptables (best effort)..."
    iptables -F || true
    iptables -t nat -F || true
    iptables -t mangle -F || true
    iptables -X || true

    log "Restarting containerd..."
    systemctl restart containerd || true

    success "Node reset complete (master/worker safe)"
  fi
}

# ---------- Smart Flows ----------

setup_master() {
  set_hostname
  disable_swap
  load_kernel_modules
  configure_sysctl
  add_k8s_repo
  install_containerd
  configure_containerd
  install_k8s_tools
  success "Master node prepared (ready for init)"
}

setup_worker() {
  set_hostname
  disable_swap
  load_kernel_modules
  configure_sysctl
  add_k8s_repo
  install_containerd
  configure_containerd
  install_k8s_tools
  success "Worker node prepared (ready to join)"
}

# ---------- Menu ----------

show_menu() {
  clear
  echo "========== Kubernetes Setup CLI =========="
  echo "1. Setup MASTER node (prepare only)"
  echo "2. Setup WORKER node (prepare only)"
  echo "3. Initialize Cluster (master)"
  echo "4. Join Cluster (worker)"
  echo "5. Post Master Setup (network + storage)"
  echo "6. Reset Cluster"
  echo "0. Exit"
  echo "=========================================="
}

# ---------- Main ----------

require_root

while true; do
  show_menu
  read -p "Choose an option: " choice

  case $choice in
    1) setup_master ;;
    2) setup_worker ;;
    3) init_cluster ;;
    4) join_cluster ;;
    5) post_master_setup ;;
    6) reset_cluster ;;
    0) exit 0 ;;
    *) echo "Invalid option" ;;
  esac

  pause
done