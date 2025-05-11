'use client'
import React from "react"

import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface JoinSwarmParams {
  remote_addrs: string;
  join_token: string;
  listen_addr: string;
  advertise_addr: string;
  data_path_addr: string;
}

interface JoinSwarmFormProps {
  onSubmit: (data: JoinSwarmParams) => Promise<void>;
  onClose: () => void;
}

export function JoinSwarmForm({ onSubmit, onClose }: JoinSwarmFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<JoinSwarmParams>();

  const handleFormSubmit = async (data: JoinSwarmParams) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to join swarm:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="remote_addrs">Remote Addresses</Label>
          <Input
            id="remote_addrs"
            {...register('remote_addrs', { required: 'Remote addresses are required' })}
            placeholder="192.168.1.1:2377,192.168.1.2:2377"
          />
          {errors.remote_addrs && (
            <p className="text-sm text-red-600">{errors.remote_addrs.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="join_token">Join Token</Label>
          <Input
            id="join_token"
            type="password"
            {...register('join_token', { required: 'Join token is required' })}
          />
          {errors.join_token && (
            <p className="text-sm text-red-600">{errors.join_token.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="listen_addr">Listen Address</Label>
          <Input
            id="listen_addr"
            {...register('listen_addr')}
            placeholder="0.0.0.0:2377"
          />
        </div>

        <div>
          <Label htmlFor="advertise_addr">Advertise Address</Label>
          <Input
            id="advertise_addr"
            {...register('advertise_addr')}
            placeholder="eth0:4567"
          />
        </div>

        <div>
          <Label htmlFor="data_path_addr">Data Path Address</Label>
          <Input
            id="data_path_addr"
            {...register('data_path_addr')}
            placeholder="192.168.1.1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Join Swarm
        </Button>
      </div>
    </form>
  );
}

