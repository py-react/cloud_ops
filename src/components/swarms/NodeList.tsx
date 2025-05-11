'use client'

import React,{ useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SwarmEntityCard } from './SwarmEntityCard'

// Mock data for demonstration
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
  {
    id: "node3id",
    name: "node3",
    type: "node" as const,
    status: "down",
    details: {
      Role: "worker",
      Availability: "active",
      Address: "192.168.1.3",
    },
    createdAt: "2023-06-01T14:00:00Z",
    updatedAt: "2023-06-02T14:00:00Z",
  }
];

export default function Nodes() {
  const [nodes, setNodes] = useState(mockNodes);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = nodes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Nodes</h1>
      <div className="flex space-x-4 mb-4">
        <Input 
          placeholder="Search nodes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm" 
        />
        <Button onClick={() => setNodes([...mockNodes])}>Refresh</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNodes.map(node => (
          <SwarmEntityCard key={node.id} entity={node} />
        ))}
      </div>
    </div>
  )
}

