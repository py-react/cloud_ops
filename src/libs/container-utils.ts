interface ParsedContainerName {
  queue: string;
  processFile: string;
  displayName: string;
}

export function parseContainerName(fullName: string): ParsedContainerName {
  let displayName = fullName
  let queue = ""
  let processFile = ""
  if(fullName.startsWith("deno_")) {
    // Remove 'deno_' prefix and timestamp suffix
    const nameWithoutPrefix = fullName.replace(/^deno_/, '');
    const [queueAndFile,prefix,processFileName] = nameWithoutPrefix.split('_').slice(0, -1);
    
    // Split remaining parts into queue name and process file
    const parts = queueAndFile.split('_');
    queue = parts.join('_');
    
    // Create a display name
    displayName = `${prefix} (${queue})`;
    processFile = processFileName

  }

  return {
    queue,
    processFile,
    displayName
  };
}