'use client'

import * as React from 'react'

export interface ErrorProps {
  message?: string
}

export const Error: React.FC<ErrorProps> = ({ message = 'An error occurred.' }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
    {message}
  </div>
) 