import clsx from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export function formatBytes(bytes: number): string {
    // Define the size units
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
    // Handle case where bytes is zero
    if (bytes === 0) return '0 Bytes';
    
    // Calculate the index for the sizes array
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    // Convert the byte count to the correct size unit and round the result to 2 decimal places
    const value = bytes / Math.pow(1024, i);
  
    // Ensure the correct pluralization of 'Byte' or 'Bytes'
    return `${value.toFixed(2)} ${sizes[i]}`;
  
}

export function formatBytesForForm(bytes: number): string {
  // Define the size units
  const sizes = ['b', 'k', 'm', 'g', 't'];
  
  // Handle case where bytes is zero
  if (bytes === 0) return '0b';
  
  // Calculate the index for the sizes array
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // Convert the byte count to the correct size unit and round the result to 2 decimal places
  const value = bytes / Math.pow(1024, i);

  // Ensure the correct pluralization of 'Byte' or 'Bytes'
  return `${value.toFixed(0)}${sizes[i]}`;
}