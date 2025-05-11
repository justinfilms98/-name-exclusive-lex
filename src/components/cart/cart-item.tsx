'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface CartItemProps {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  dragHandleProps?: any
}

export function CartItem({
  id,
  name,
  image,
  price,
  quantity,
  onQuantityChange,
  onRemove,
  dragHandleProps,
}: CartItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm">
      <div {...dragHandleProps} className="cursor-move">
        <Image
          src={image}
          alt={name}
          width={100}
          height={100}
          className="rounded-md object-cover"
        />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-text-secondary">${price.toFixed(2)}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuantityChange(id, Math.max(0, quantity - 1))}
        >
          -
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuantityChange(id, quantity + 1)}
        >
          +
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(id)}
        className="text-destructive hover:text-destructive/90"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove item</span>
      </Button>
    </div>
  )
} 