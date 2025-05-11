import React, { useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from 'lucide-react'
import SmartDataViewer from "../queues/queueJob/SmartDataViewer";

interface ResourceTableProps {
  resources: any[]
  columns: { key: string; header: string }[]
  onEdit?: (resource: any) => void
  onDelete?: (resource: any) => void
}

export default function ResourceTable({ resources, columns, onEdit, onDelete }: ResourceTableProps) {
  return (
    <div className="flex flex-col gap-4">
      {resources.map((resource) => (
        <div key={resource.metadata.uid} className="p-4 border-b border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
          <SmartDataViewer label={resource.metadata.name} data={resource} level={1} />
        </div>
      ))}
    </div>
  )
}
// export default function ResourceTable({ resources, columns, onEdit, onDelete }: ResourceTableProps) {
//   const showActions = onEdit || onDelete;

//   useEffect(()=>{
//     console.log({resources})
//   },[resources])
//   return (
//     <Table>
//       <TableHeader>
//         <TableRow>
//           {columns.map((column) => (
//             <TableHead key={column.key}>{column.header}</TableHead>
//           ))}
//           {showActions && <TableHead>Actions</TableHead>}
//         </TableRow>
//       </TableHeader>
//       <TableBody>
//         {resources.map((resource) => (
//           <TableRow key={resource.metadata.uid}>
//             {columns.map((column) => (
//               <TableCell key={column.key}>
//                 {column.key.split('.').reduce((obj, key) => obj && obj[key], resource)}
//               </TableCell>
//             ))}
//             {showActions && (
//               <TableCell>
//                 {onEdit && (
//                   <Button variant="ghost" size="icon" onClick={() => onEdit(resource)}>
//                     <Pencil className="h-4 w-4" />
//                   </Button>
//                 )}
//                 {onDelete && (
//                   <Button variant="ghost" size="icon" onClick={() => onDelete(resource)}>
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 )}
//               </TableCell>
//             )}
//           </TableRow>
//         ))}
//       </TableBody>
//     </Table>
//   )
// }

