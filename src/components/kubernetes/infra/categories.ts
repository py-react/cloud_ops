import {
    Layers,
    Server,
    Database,
    CloudIcon,
    ShieldCheckIcon,
    Box
  } from 'lucide-react';

export const categories = [
    {
      name: 'Applications',
      icon: Box,
      subcategories: [
        { name: 'Frontend', description: 'User-facing applications' },
        { name: 'Backend', description: 'API and business logic services' },
        { name: 'Jobs', description: 'Batch and cron jobs' }
      ]
    },
    {
      name: 'Microservices',
      icon: Server,
      subcategories: [
        { name: 'API Gateway', description: 'API routing and management' },
        { name: 'Auth Service', description: 'Authentication and authorization' },
        { name: 'User Service', description: 'User management' }
      ]
    },
    {
      name: 'Databases',
      icon: Database,
      subcategories: [
        { name: 'SQL', description: 'Relational databases' },
        { name: 'NoSQL', description: 'Non-relational databases' },
        { name: 'Cache', description: 'In-memory databases' }
      ]
    },
    {
      name: 'Messaging',
      icon: Layers,
      subcategories: [
        { name: 'Message Queues', description: 'Asynchronous messaging' },
        { name: 'Event Bus', description: 'Event streaming' },
        { name: 'Pub/Sub', description: 'Publisher/Subscriber systems' }
      ]
    },
    {
      name: 'Infrastructure',
      icon: CloudIcon,
      subcategories: [
        { name: 'Networking', description: 'Network policies and ingress' },
        { name: 'Storage', description: 'Persistent volumes and claims' },
        { name: 'Monitoring', description: 'Metrics and alerting' }
      ]
    },
    {
      name: 'Security',
      icon: ShieldCheckIcon,
      subcategories: [
        { name: 'Certificates', description: 'TLS certificates' },
        { name: 'Secrets', description: 'Sensitive data management' },
        { name: 'Policies', description: 'Security policies' }
      ]
    }
  ];
  