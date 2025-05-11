'use client'

import React,{ useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SwarmEntityCard } from './SwarmEntityCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import FormInput from './FormInput'

// Mock data for demonstration
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

export default function Services() {
  const [services, setServices] = useState(mockServices);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Handle service creation logic here
    console.log('Service created')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Services</h1>
      <div className="flex space-x-4 mb-4">
        <Input 
          placeholder="Search services..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm" 
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateService} className="space-y-4">
              <FormInput label="Service Name" name="name" required />
              <FormInput label="Image" name="image" required />
              <FormInput label="Replicas" name="replicas" type="number" required />
              <FormInput label="Command" name="command" />
              <FormInput label="Arguments" name="args" />
              <FormInput label="Constraints" name="constraints" />
              <FormInput label="Env Variables" name="env" placeholder="KEY1=VAL1,KEY2=VAL2" />
              <Button type="submit">Create Service</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <SwarmEntityCard key={service.id} entity={service} />
        ))}
      </div>
    </div>
  )
}

