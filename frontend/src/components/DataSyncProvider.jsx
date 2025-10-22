'use client'
import React, { createContext, useContext } from 'react'
import useDataSync from '@/hooks/useDataSync' // ✅ 기본 import

const DataSyncContext = createContext(null)

export const DataSyncProvider = ({ children }) => {
  const dataSync = useDataSync()
  return (
    <DataSyncContext.Provider value={dataSync}>
      {children}
    </DataSyncContext.Provider>
  )
}

export const useDataSyncContext = () => {
  const ctx = useContext(DataSyncContext)
  if (!ctx) throw new Error('useDataSyncContext must be used within DataSyncProvider')
  return ctx
}
