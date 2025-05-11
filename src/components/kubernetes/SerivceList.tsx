import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Service } from '../types/kubernetes';

interface ServiceListProps {
  services: Service[];
}

export function ServiceList({ services }: ServiceListProps) {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <div key={`${service.metadata.namespace}-${service.metadata.name}`} className="border border-gray-200 rounded-lg">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedService(
              expandedService === service.metadata.name ? null : service.metadata.name
            )}
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{service.metadata.name}</h3>
              <p className="text-sm text-gray-500">Namespace: {service.metadata.namespace}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-medium">Type: </span>
                {service.spec.type}
              </div>
              <div>
                <span className="font-medium">ClusterIP: </span>
                {service.spec.clusterIP}
              </div>
              {expandedService === service.metadata.name ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
          
          {expandedService === service.metadata.name && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-4">
                {service.externalIPs && service.externalIPs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">External IPs</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.externalIPs.map((ip) => (
                        <span
                          key={ip}
                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm"
                        >
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Ports</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Protocol</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Port</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Target Port</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {service.spec.ports.map((port, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{port.name || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{port.protocol}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{port.port}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{port.targetPort}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Selector Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(service.spec.selector || {}).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}