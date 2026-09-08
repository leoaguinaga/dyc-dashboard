'use client'

import * as React from 'react'
import { Suspense, useState, useTransition } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from '@/components/ui/tabs'

export interface TabItem {
  id: string
  label: string
  count?: number
  badge?: string
  fallback?: React.ReactNode
  content: React.ReactNode
}

interface Props {
  tabs: TabItem[]
  defaultTab?: string
}

function ProyectoTabsInner({ tabs, defaultTab = 'general' }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlTab = searchParams.get('tab')
  const validUrlTab = urlTab && tabs.some((t) => t.id === urlTab) ? urlTab : defaultTab

  // Estado local para respuesta inmediata (0ms) al hacer click sin esperar a que Next.js resuelva la URL
  const [prevUrlTab, setPrevUrlTab] = useState(validUrlTab)
  const [selectedTab, setSelectedTab] = useState(validUrlTab)
  const [, startTransition] = useTransition()

  if (validUrlTab !== prevUrlTab) {
    setPrevUrlTab(validUrlTab)
    setSelectedTab(validUrlTab)
  }

  function handleTabChange(value: string | number) {
    const val = String(value)
    // 1. Cambio inmediato de UI para feedback instantáneo
    setSelectedTab(val)

    // 2. Transición en segundo plano para sincronizar la URL sin congelar el hilo principal
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', val)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <Tabs
      value={selectedTab}
      onValueChange={handleTabChange}
      className="w-full space-y-4"
    >
      <div className="border-b border-border pb-1 overflow-x-auto">
        <TabsList className="h-10 p-1 bg-muted/60 border border-border/80">
          <TabsIndicator />
          {tabs.map((tab) => (
            <TabsTab
              key={tab.id}
              value={tab.id}
              className="gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all"
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[11px] font-mono tabular-nums leading-none text-muted-foreground">
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {tab.badge}
                </span>
              )}
            </TabsTab>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsPanel key={tab.id} value={tab.id} className="focus-visible:outline-none">
          <Suspense
            fallback={
              tab.fallback ?? (
                <div className="h-64 w-full animate-pulse rounded-xl border border-border bg-card p-5" />
              )
            }
          >
            {tab.content}
          </Suspense>
        </TabsPanel>
      ))}
    </Tabs>
  )
}

export function ProyectoTabsClient(props: Props) {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted/40" />}>
      <ProyectoTabsInner {...props} />
    </Suspense>
  )
}
