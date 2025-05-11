'use client'

import * as React from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, ...props }, ref) => (
    <select
      ref={ref}
      className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select' 