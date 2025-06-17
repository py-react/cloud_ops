import React from "react";
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OptionalBadge } from "../badges";


export const AuthTab = ({ control, errors }: { control: any; errors: any }) => (
    <>
      <div className="grid grid-cols-2 gap-6">
        <FormField
          control={control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Bearer Token <OptionalBadge />
              </FormLabel>
              <FormDescription>
                Authentication token for the Kubernetes API
              </FormDescription>
              <FormControl>
                <Input type="password" placeholder="Token" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
  
        <FormField
          control={control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Username <OptionalBadge />
              </FormLabel>
              <FormDescription>
                Basic auth username (if token is not used)
              </FormDescription>
              <FormControl>
                <Input placeholder="admin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
  
      <div className="grid grid-cols-2 gap-6 mt-4">
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password <OptionalBadge />
              </FormLabel>
              <FormDescription>
                Basic auth password (if token is not used)
              </FormDescription>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
  
        <FormField
          control={control}
          name="client_certificate_data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Client Certificate Data <OptionalBadge />
              </FormLabel>
              <FormDescription>
                Base64 encoded client certificate for authentication
              </FormDescription>
              <FormControl>
                <Input placeholder="Base64 encoded certificate" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
  
      <FormField
        control={control}
        name="client_key_data"
        render={({ field }) => (
          <FormItem className="mt-4">
            <FormLabel>
              Client Key Data <OptionalBadge />
            </FormLabel>
            <FormDescription>
              Base64 encoded client key for certificate authentication
            </FormDescription>
            <FormControl>
              <Input placeholder="Base64 encoded key data" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
  