'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { EXERCISE_DIFFICULTIES } from '@/lib/constants/ui'
import { ExerciseDifficulty } from '@/lib/supabase/schema/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function ExercisesSearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [title, setTitle] = useState(searchParams.get('title'))
  const [description, setDescription] = useState(searchParams.get('description'))
  const [difficulties, setDifficulties] = useState<ExerciseDifficulty[]>(
    (searchParams.getAll('difficulty') as ExerciseDifficulty[]) ?? [],
  )
  const [createdAtFrom, setCreatedAtFrom] = useState(searchParams.get('createdAtFrom'))
  const [createdAtTo, setCreatedAtTo] = useState(searchParams.get('createdAtTo'))

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className='rounded-lg border mb-6'
    >
      <CollapsibleTrigger asChild>
        <div className='flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors'>
          <Button variant='ghost' size='sm' className='w-9 p-0'>
            {isOpen ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className='overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up'>
        <div className='p-4 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>タイトル</label>
              <Input
                placeholder='タイトルで検索'
                value={title ?? ''}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>説明</label>
              <Input
                placeholder='説明で検索'
                value={description ?? ''}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>難易度</label>
              <div className='flex gap-4 pt-2'>
                {EXERCISE_DIFFICULTIES.map((option) => (
                  <div key={option.value} className='flex items-center space-x-2'>
                    <Checkbox
                      id={option.value}
                      checked={difficulties.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const target = option.value
                        setDifficulties((prev) =>
                          checked ? [...prev, target] : prev.filter((d) => d !== target),
                        )
                      }}
                    />
                    <label
                      htmlFor={option.value}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>作成日</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='date'
                  value={createdAtFrom ?? ''}
                  onChange={(e) => setCreatedAtFrom(e.target.value)}
                  placeholder='開始日'
                />
                <span className='text-sm text-muted-foreground'>〜</span>
                <Input
                  type='date'
                  value={createdAtTo ?? ''}
                  onChange={(e) => setCreatedAtTo(e.target.value)}
                  placeholder='終了日'
                />
              </div>
            </div>
          </div>
          <div className='flex gap-2 justify-end'>
            <Button
              variant='outline'
              onClick={() => {
                setTitle('')
                setDescription('')
                setDifficulties([])
                setCreatedAtFrom('')
                setCreatedAtTo('')
              }}
            >
              クリア
            </Button>
            <Button
              onClick={() => {
                const params = new URLSearchParams()

                if (title) params.set('title', title)
                if (description) params.set('description', description)
                difficulties.forEach((difficulty) =>
                  params.append('difficulty', difficulty),
                )
                if (createdAtFrom) params.set('createdAtFrom', createdAtFrom)
                if (createdAtTo) params.set('createdAtTo', createdAtTo)
                params.set('page', '1')

                router.push(`?${params.toString()}`)

                setIsOpen(false)
              }}
            >
              検索
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
