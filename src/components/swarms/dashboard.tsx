'use client'

import React,{ useState } from 'react'
import { Card,CardHeader,CardContent, } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Modal } from './Modal'
import { InitializeSwarmForm } from './InitializeSwarmForm'
import { JoinSwarmForm } from './JoinSwarmForm'
import { toast } from "sonner";
import { SwarmStatusCard } from './SwarmStatusCard'
import { SwarmEntityCard } from './SwarmEntityCard'
import { WorkInProgress } from '../work-in-progress'

// Mock data for demonstration
const mockSwarmStatus = {
  ID: "abcdef123456",
  Version: {
    Index: 55
  },
  CreatedAt: "2023-06-01T12:00:00Z",
  UpdatedAt: "2023-06-02T12:00:00Z",
  Nodes: 3,
  Managers: 1,
  Workers: 2
};

const mockNodes = [
  {
    id: "node1id",
    name: "node1",
    type: "node" as const,
    status: "ready",
    details: {
      Role: "manager",
      Availability: "active",
      Address: "192.168.1.1",
    },
    createdAt: "2023-06-01T12:00:00Z",
    updatedAt: "2023-06-02T12:00:00Z",
  },
  {
    id: "node2id",
    name: "node2",
    type: "node" as const,
    status: "ready",
    details: {
      Role: "worker",
      Availability: "active",
      Address: "192.168.1.2",
    },
    createdAt: "2023-06-01T13:00:00Z",
    updatedAt: "2023-06-02T13:00:00Z",
  },
];

const mockServices = [
  {
    id: "service1id",
    name: "web",
    type: "service" as const,
    status: "running",
    details: {
      Image: "nginx:latest",
      Replicas: 3,
      Mode: "replicated",
    },
    createdAt: "2023-06-01T12:00:00Z",
    updatedAt: "2023-06-02T12:00:00Z",
  },
  {
    id: "service2id",
    name: "db",
    type: "service" as const,
    status: "running",
    details: {
      Image: "postgres:13",
      Replicas: 1,
      Mode: "replicated",
    },
    createdAt: "2023-06-01T13:00:00Z",
    updatedAt: "2023-06-02T13:00:00Z",
  },
];

export default function SwarmDashboard() {
  const [isSwarmEmpty, setIsSwarmEmpty] = useState(false)
  const [initializeModalOpen, setInitializeModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const handleInitializeSwarm = async (data: any) => {
    console.log('Initializing swarm:', data)
    // TODO: Implement swarm initialization
    toast.info("Your swarm has been successfully initialized.")
    setInitializeModalOpen(false)
  }

  const handleJoinSwarm = async (data: any) => {
    console.log('Joining swarm:', data)
    // TODO: Implement swarm joining
    toast.info("Successfully joined the swarm.")
    setJoinModalOpen(false)
  }

  const handleSwarmReload = () => {
    console.log('Reloading swarm status')
    // TODO: Implement swarm reload
    toast.info("Swarm status has been refreshed.")
  }

  const handleSwarmGetUnlockKey = () => {
    console.log('Getting swarm unlock key')
    // TODO: Implement get unlock key
    toast.info("Swarm unlock key has been fetched.")
  }

  const handleSwarmUpdate = (data: any) => {
    console.log('Updating swarm:', data)
    // TODO: Implement swarm update
    toast.info("Swarm has been updated successfully.",)
  }

  const handleNodeReload = (nodeId: string) => {
    console.log('Reloading node:', nodeId)
    // TODO: Implement node reload
    toast.info(`Node ${nodeId} has been refreshed.`,)
  }

  const handleNodeUpdate = (nodeId: string, data: any) => {
    console.log('Updating node:', nodeId, data)
    // TODO: Implement node update
    toast.info(`Node ${nodeId} has been updated successfully.`,)
  }

  const handleServiceReload = (serviceId: string) => {
    console.log('Reloading service:', serviceId)
    // TODO: Implement service reload
    toast.info(`Service ${serviceId} has been refreshed.`,)
  }

  const handleServiceUpdate = (serviceId: string, data: any) => {
    console.log('Updating service:', serviceId, data)
    // TODO: Implement service update
    toast.info(`Service ${serviceId} has been updated successfully.`,)
  }

  const handleServiceScale = (serviceId: string, replicas: number) => {
    console.log('Scaling service:', serviceId, 'to', replicas, 'replicas')
    // TODO: Implement service scaling
    toast.info(`Service ${serviceId} has been scaled to ${replicas} replicas.`,)
  }

  const handleServiceTasks = (serviceId: string) => {
    console.log('Viewing tasks for service:', serviceId)
    // TODO: Implement viewing service tasks
    toast.info(`Viewing tasks for service ${serviceId}.`,)
  }

  if(true){
    return <WorkInProgress
      title="Exciting New Feature Coming Soon!"
      message="I am putting the finishing touches on something that will revolutionize your experience. Stay tuned!"
    />
  }

  if(isSwarmEmpty){
      return (
        <div className="flex items-center justify-center mt-8 bg-gray-50">
      <Card className="w-full sm:w-96 bg-white shadow-lg rounded-lg">
        <CardHeader>
          <h2 className="text-center text-xl font-semibold text-gray-800">Docker Swarm Not Initialized</h2>
        </CardHeader>
        <CardContent className="text-center space-y-4 p-6">
          <p className="text-gray-500">
            Your Docker Swarm is not yet initialized or joined. Please initialize a new Swarm or join an existing one to manage services and nodes.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => console.log('Initialize Swarm Button Clicked')}
              className="w-full"
            >
              Initialize Swarm
            </Button>
            <Button
              variant="secondary"
              onClick={() => console.log('Join Existing Swarm Button Clicked')}
              className="w-full"
            >
              Join Existing Swarm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
      )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Docker Swarm Manager Dashboard</h1>
      <SwarmStatusCard 
        status={mockSwarmStatus}
        onReload={handleSwarmReload}
        onGetUnlockKey={handleSwarmGetUnlockKey}
        onUpdate={handleSwarmUpdate}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockNodes.map(node => (
          <SwarmEntityCard 
            key={node.id} 
            entity={node}
            onReload={() => handleNodeReload(node.id)}
            onUpdate={(data) => handleNodeUpdate(node.id, data)}
          />
        ))}
        {mockServices.map(service => (
          <SwarmEntityCard 
            key={service.id} 
            entity={service}
            onReload={() => handleServiceReload(service.id)}
            onUpdate={(data) => handleServiceUpdate(service.id, data)}
            onScale={(replicas) => handleServiceScale(service.id, replicas)}
            onTasks={() => handleServiceTasks(service.id)}
          />
        ))}
      </div>
      <div className="flex space-x-4">
        <Button onClick={() => setInitializeModalOpen(true)}>Initialize Swarm</Button>
        <Button onClick={() => setJoinModalOpen(true)}>Join Swarm</Button>
      </div>

      <Modal open={initializeModalOpen} onClose={() => setInitializeModalOpen(false)} title="Initialize Swarm">
        <InitializeSwarmForm onSubmit={handleInitializeSwarm} onClose={() => setInitializeModalOpen(false)} />
      </Modal>

      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Join Swarm">
        <JoinSwarmForm onSubmit={handleJoinSwarm} onClose={() => setJoinModalOpen(false)} />
      </Modal>
    </div>
  )
}

