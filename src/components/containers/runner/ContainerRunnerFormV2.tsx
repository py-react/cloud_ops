import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Plus, Minus, HelpCircle } from 'lucide-react'

const tabs = [
  { id: 'basic', label: 'Basic' },
  { id: 'resources', label: 'Resources' },
  { id: 'network', label: 'Network' },
  { id: 'storage', label: 'Storage' },
  { id: 'health', label: 'Health Check' },
  { id: 'security', label: 'Security' },
  { id: 'advanced', label: 'Advanced' },
];


export function RunContainerModal() {
  const [activeTab, setActiveTab] = useState("basic");
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({
    image: '',
    command: '',
    name: '',
    detach: false,
    auto_remove: false,
    blkio_weight_device: [],
    blkio_weight: null,
    cap_add: [],
    cap_drop: [],
    cgroup_parent: '',
    cgroupns: '',
    cpu_count: null,
    cpu_percent: null,
    cpu_period: null,
    cpu_quota: null,
    cpu_rt_period: null,
    cpu_rt_runtime: null,
    cpu_shares: null,
    cpuset_cpus: '',
    cpuset_mems: '',
    device_cgroup_rules: [],
    device_read_bps: [],
    device_read_iops: [],
    device_write_bps: [],
    device_write_iops: [],
    devices: [],
    device_requests: [],
    dns: [],
    dns_opt: [],
    dns_search: [],
    domainname: '',
    entrypoint: '',
    environment: {},
    extra_hosts: {},
    group_add: [],
    healthcheck: {
      test: [],
      interval: null,
      timeout: null,
      retries: null,
      start_period: null
    },
    hostname: '',
    init: null,
    init_path: '',
    ipc_mode: '',
    isolation: '',
    kernel_memory: null,
    labels: {},
    links: {},
    log_config: {
      type: '',
      config: {}
    },
    lxc_conf: {},
    mac_address: '',
    mem_limit: null,
    mem_reservation: null,
    mem_swappiness: null,
    memswap_limit: null,
    mounts: [],
    network: '',
    network_disabled: false,
    network_mode: '',
    oom_kill_disable: false,
    oom_score_adj: null,
    pid_mode: '',
    pids_limit: null,
    platform: '',
    ports: [],
    privileged: false,
    publish_all_ports: false,
    read_only: false,
    restart_policy: '',
    runtime: '',
    security_opt: [],
    shm_size: null,
    stdin_open: false,
    stdout: true,
    stderr: false,
    stop_signal: '',
    storage_opt: {},
    stream: false,
    sysctls: {},
    tmpfs: {},
    tty: false,
    ulimits: [],
    use_config_proxy: false,
    user: '',
    userns_mode: '',
    uts_mode: '',
    volume_driver: '',
    volumes: [],
    volumes_from: [],
    working_dir: '',
  })

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Image *
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="e.g., ubuntu:latest"
                      required
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The image to run, e.g., 'ubuntu:latest'</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="command" className="text-right">
                    Command
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="command"
                      name="command"
                      value={formData.command}
                      onChange={handleInputChange}
                      placeholder="e.g., /bin/bash"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The command to run in the container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Container Name
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., my-container"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A name for this container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="detach" className="text-right">
                    Detach
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Checkbox
                      id="detach"
                      name="detach"
                      checked={formData.detach}
                      onCheckedChange={(checked) => setFormData(prevData => ({ ...prevData, detach: checked }))}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Run container in background and return container ID</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="entrypoint" className="text-right">
                    Entrypoint
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="entrypoint"
                      name="entrypoint"
                      value={formData.entrypoint}
                      onChange={handleInputChange}
                      placeholder="e.g., /docker-entrypoint.sh"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The entrypoint for the container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="working_dir" className="text-right">
                    Working Directory
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="working_dir"
                      name="working_dir"
                      value={formData.working_dir}
                      onChange={handleInputChange}
                      placeholder="e.g., /app"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Working directory inside the container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
        );
      case "resources":
        return <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="cpu_shares" className="text-right">
            CPU Shares
          </Label>
          <div className="col-span-3 flex items-center gap-2">
            <Input
              id="cpu_shares"
              name="cpu_shares"
              type="number"
              value={formData.cpu_shares || ''}
              onChange={handleInputChange}
              placeholder="e.g., 1024"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>CPU shares (relative weight)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="memory" className="text-right">
            Memory Limit
          </Label>
          <div className="col-span-3 flex items-center gap-2">
            <Input
              id="memory"
              name="memory"
              value={formData.memory}
              onChange={handleInputChange}
              placeholder="e.g., 512m, 1g"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Memory limit (format: &lt;number&gt;&lt;unit&gt;, where unit = b, k, m or g)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="cpuset_cpus" className="text-right">
            CPUs
          </Label>
          <div className="col-span-3 flex items-center gap-2">
            <Input
              id="cpuset_cpus"
              name="cpuset_cpus"
              value={formData.cpuset_cpus}
              onChange={handleInputChange}
              placeholder="e.g., 0-3, 0,1"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>CPUs in which to allow execution (0-3, 0,1)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>;
      case "network":
        return (
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="network" className="text-right">
                    Network
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Select
                      onValueChange={(value) => handleSelectChange('network', value)}
                      defaultValue={formData.network}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bridge">bridge</SelectItem>
                        <SelectItem value="host">host</SelectItem>
                        <SelectItem value="none">none</SelectItem>
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Network to connect the container to</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ports" className="text-right">
                    Ports
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {formData.ports.map((port: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={port}
                          onChange={(e) => handleArrayInputChange('ports', index, e.target.value)}
                          placeholder="host:container, e.g. 8080:80"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('ports', index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('ports')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Port
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ports to bind inside the container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dns" className="text-right">
                    DNS
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {formData.dns.map((dns: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={dns}
                          onChange={(e) => handleArrayInputChange('dns', index, e.target.value)}
                          placeholder="DNS server, e.g. 8.8.8.8"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('dns', index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('dns')}>
                      <Plus className="mr-2 h-4 w-4" /> Add DNS
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Set custom DNS servers</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hostname" className="text-right">
                    Hostname
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="hostname"
                      name="hostname"
                      value={formData.hostname}
                      onChange={handleInputChange}
                      placeholder="e.g., my-container-host"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Optional hostname for the container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
        );
      case "storage":
        return (
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="volumes" className="text-right">
                    Volumes
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {formData.volumes.map((volume: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={volume}
                          onChange={(e) => handleArrayInputChange('volumes', index, e.target.value)}
                          placeholder="host_path:container_path"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('volumes', index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('volumes')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Volume
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bind mount a volume (host_path:container_path[:options])</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="volume_driver" className="text-right">
                    Volume Driver
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="volume_driver"
                      name="volume_driver"
                      value={formData.volume_driver}
                      onChange={handleInputChange}
                      placeholder="e.g., local"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Optional volume driver for the container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
        );
      case "health":
        return (
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="healthcheck_test" className="text-right">
                    Test Command
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="healthcheck_test"
                      name="healthcheck_test"
                      value={formData.healthcheck.test.join(' ')}
                      onChange={(e) => setFormData(prevData => ({
                        ...prevData,
                        healthcheck: { ...prevData.healthcheck, test: e.target.value.split(' ') }
                      }))}
                      placeholder="e.g., ['CMD-SHELL', 'curl -f http://localhost/ || exit 1']"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The test to perform to check that the container is healthy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="healthcheck_interval" className="text-right">
                    Interval
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="healthcheck_interval"
                      name="healthcheck_interval"
                      type="number"
                      value={formData.healthcheck.interval || ''}
                      onChange={(e) => setFormData(prevData => ({
                        ...prevData,
                        healthcheck: { ...prevData.healthcheck, interval: e.target.value ? Number(e.target.value) : null }
                      }))}
                      placeholder="e.g., 30000000000"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Time between running the check (ns|us|ms|s|m|h) (default 30s)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="healthcheck_timeout" className="text-right">
                    Timeout
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="healthcheck_timeout"
                      name="healthcheck_timeout"
                      type="number"
                      value={formData.healthcheck.timeout || ''}
                      onChange={(e) => setFormData(prevData => ({
                        ...prevData,
                        healthcheck: { ...prevData.healthcheck, timeout: e.target.value ? Number(e.target.value) : null }
                      }))}
                      placeholder="e.g., 30000000000"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Maximum time to allow one check to run (ns|us|ms|s|m|h) (default 30s)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="healthcheck_retries" className="text-right">
                    Retries
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="healthcheck_retries"
                      name="healthcheck_retries"
                      type="number"
                      value={formData.healthcheck.retries || ''}
                      onChange={(e) => setFormData(prevData => ({
                        ...prevData,
                        healthcheck: { ...prevData.healthcheck, retries: e.target.value ? Number(e.target.value) : null }
                      }))}
                      placeholder="e.g., 3"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Consecutive failures needed to report unhealthy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="healthcheck_start_period" className="text-right">
                    Start Period
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="healthcheck_start_period"id="healthcheck_start_period"
                      name="healthcheck_start_period"
                      type="number"
                      value={formData.healthcheck.start_period || ''}
                      onChange={(e) => setFormData(prevData => ({
                        ...prevData,
                        healthcheck: { ...prevData.healthcheck, start_period: e.target.value ? Number(e.target.value) : null }
                      }))}
                      placeholder="e.g., 0"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Start period for the container to initialize before starting health-retries countdown (ns|us|ms|s|m|h) (default 0s)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
        );
      case "security":
        return (
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cap_add" className="text-right">
                    Add Capabilities
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {formData.cap_add.map((cap: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={cap}
                          onChange={(e) => handleArrayInputChange('cap_add', index, e.target.value)}
                          placeholder="e.g., SYS_ADMIN"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('cap_add', index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('cap_add')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Capability
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Linux capabilities</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cap_drop" className="text-right">
                    Drop Capabilities
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {formData.cap_drop.map((cap: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={cap}
                          onChange={(e) => handleArrayInputChange('cap_drop', index, e.target.value)}
                          placeholder="e.g., NET_ADMIN"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem('cap_drop', index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('cap_drop')}>
                      <Plus className="mr-2 h-4 w-4" /> Drop Capability
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Drop Linux capabilities</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="privileged" className="text-right">
                    Privileged
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Checkbox
                      id="privileged"
                      name="privileged"
                      checked={formData.privileged}
                      onCheckedChange={(checked) => setFormData(prevData => ({ ...prevData, privileged: checked }))}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Give extended privileges to this container</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
        );
      case "advanced":
        return (
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="environment" className="text-right">
                    Environment
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="environment"
                      name="environment"
                      placeholder="KEY=value, ANOTHER_KEY=value"
                      value={Object.entries(formData.environment).map(([key, value]) => `${key}=${value}`).join(', ')}
                      onChange={(e) => {
                        const envObj = e.target.value.split(',').reduce((acc, curr) => {
                          const [key, value] = curr.trim().split('=')
                          if (key && value) {
                            acc[key] = value
                          }
                          return acc
                        }, {})
                        setFormData(prevData => ({ ...prevData, environment: envObj }))
                      }}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Set environment variables</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="restart_policy" className="text-right">
                    Restart Policy
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Select
                      onValueChange={(value) => handleSelectChange('restart_policy', value)}
                      defaultValue={formData.restart_policy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select restart policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="on-failure">On Failure</SelectItem>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="unless-stopped">Unless Stopped</SelectItem>
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Restart policy to apply when a container exits</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="auto_remove" className="text-right">
                    Auto Remove
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Checkbox
                      id="auto_remove"
                      name="auto_remove"
                      checked={formData.auto_remove}
                      onCheckedChange={(checked) => setFormData(prevData => ({ ...prevData, auto_remove: checked }))}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Automatically remove the container when it exits</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className="text-right">
                    User
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="user"
                      name="user"
                      value={formData.user}
                      onChange={handleInputChange}
                      placeholder="e.g., 1000:1000"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Username or UID (format: &lt;name|uid&gt;[:&lt;group|gid&gt;])</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
        );
      default:
        return null;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleArrayInputChange = (name: string, index: number, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: prevData[name].map((item: string, i: number) => i === index ? value : item)
    }))
  }

  const addArrayItem = (name: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: [...prevData[name], '']
    }))
  }

  const removeArrayItem = (name: string, index: number) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: prevData[name].filter((_: any, i: number) => i !== index)
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const runParams: Record<string, any> = {}

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          runParams[key] = value.filter((item: string) => item !== '')
        } else if (typeof value === 'object') {
          runParams[key] = Object.fromEntries(
            Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '')
          )
        } else {
          runParams[key] = value
        }
      }
    })

    // Handle special cases
    if (runParams.command && typeof runParams.command === 'string') {
      runParams.command = runParams.command.split(' ')
    }
    if (runParams.entrypoint && typeof runParams.entrypoint === 'string') {
      runParams.entrypoint = runParams.entrypoint.split(' ')
    }

    // Convert string inputs to appropriate types
    const numberFields = ['blkio_weight', 'cpu_count', 'cpu_percent', 'cpu_period', 'cpu_quota', 'cpu_rt_period', 'cpu_rt_runtime', 'cpu_shares', 'kernel_memory', 'mem_limit', 'mem_reservation', 'mem_swappiness', 'memswap_limit', 'oom_score_adj', 'pids_limit', 'shm_size']
    numberFields.forEach(field => {
      if (runParams[field]) {
        runParams[field] = Number(runParams[field])
      }
    })

    console.log('Running container with settings:', runParams)
    // TODO: Implement container run logic
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">{renderTabContent()}</div>

      <DialogFooter>
        <Button type="submit">Run Container</Button>
      </DialogFooter>
    </form>
  )
}

