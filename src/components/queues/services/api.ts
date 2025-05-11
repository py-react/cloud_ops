import { RunContainerPayload } from "../types/container";

const API_BASE = '/api/queue';
const API_BASE_JOB = '/api/queueJob';

export async function fetchQueues() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error('Failed to fetch containers');
  return response.json();
}

export async function startQueue(payload: RunContainerPayload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to start container');
  return response.json();
}

export async function removeQueue(queueName: string) {
  const response = await fetch(API_BASE, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queueName }),
  });
  if (!response.ok) throw new Error('Failed to stop container');
  return response.json();
}

export async function addItemToQueue(payload){
    const response = await fetch(API_BASE_JOB, {
        method:"POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('Failed to stop container');
  return response.json();
}